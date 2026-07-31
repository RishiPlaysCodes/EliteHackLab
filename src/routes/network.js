const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/network/index', {
    title: 'Network Security Labs',
    labs: [
      { id: 'port-scan', name: 'Port Scanning Simulation', difficulty: 'Easy', path: '/labs/network/port-scan' },
      { id: 'dns-enum', name: 'DNS Enumeration', difficulty: 'Medium', path: '/labs/network/dns-enum' },
      { id: 'packet-analysis', name: 'Packet Analysis', difficulty: 'Medium', path: '/labs/network/packet-analysis' },
      { id: 'mitm', name: 'MITM Concepts', difficulty: 'Hard', path: '/labs/network/mitm' },
      { id: 'arp', name: 'ARP Spoofing Theory', difficulty: 'Medium', path: '/labs/network/arp' },
    ]
  });
});

// Simulated network with open ports
const networkMap = {
  '192.168.1.1': { hostname: 'gateway', ports: [22, 80, 443], os: 'Linux', services: { 22: 'SSH OpenSSH 7.9', 80: 'HTTP nginx/1.18', 443: 'HTTPS nginx/1.18' } },
  '192.168.1.10': { hostname: 'web-server', ports: [22, 80, 443, 3306, 8080], os: 'Ubuntu 20.04', services: { 22: 'SSH OpenSSH 8.2', 80: 'HTTP Apache/2.4.41', 443: 'HTTPS Apache/2.4.41', 3306: 'MySQL 8.0.28', 8080: 'HTTP Tomcat/9.0 - ADMIN PANEL' } },
  '192.168.1.20': { hostname: 'file-server', ports: [21, 22, 139, 445, 2049], os: 'Windows Server 2019', services: { 21: 'FTP vsftpd 3.0.3 (Anonymous login!)', 22: 'SSH', 139: 'NetBIOS-SSN', 445: 'SMB Microsoft-DS', 2049: 'NFS (exports: /shared)' } },
  '192.168.1.30': { hostname: 'db-server', ports: [3306, 5432, 6379, 27017], os: 'CentOS 8', services: { 3306: 'MySQL 5.7 (root:root)', 5432: 'PostgreSQL 13', 6379: 'Redis 6.2 (NO AUTH!)', 27017: 'MongoDB 4.4 (NO AUTH!)' } },
  '192.168.1.50': { hostname: 'dev-machine', ports: [22, 3000, 8000, 9090], os: 'macOS', services: { 22: 'SSH', 3000: 'Node.js Dev Server', 8000: 'Django Debug (DEBUG=True)', 9090: 'Prometheus (no auth)' } },
  '192.168.1.100': { hostname: 'printer', ports: [80, 631, 9100], os: 'Embedded', services: { 80: 'HTTP Admin Panel (admin:admin)', 631: 'IPP CUPS', 9100: 'RAW Printing' } },
  '192.168.1.254': { hostname: 'SECRET-SERVER', ports: [22, 4444, 8443], os: 'Linux', services: { 22: 'SSH', 4444: 'Metasploit Handler', 8443: 'SECRET ADMIN - FLAG{network_scan_complete}' } },
};

router.get('/port-scan', (req, res) => {
  res.render('labs/network/port-scan', { title: 'Port Scanning', labId: 'network-scan', hosts: Object.keys(networkMap) });
});

router.post('/port-scan/scan', (req, res) => {
  const { target, scanType } = req.body;
  
  if (target === '192.168.1.0/24' || target === 'all') {
    return res.json({ success: true, results: networkMap, flag: 'Find the SECRET-SERVER!' });
  }
  
  const host = networkMap[target];
  if (!host) return res.json({ success: false, error: `Host ${target} not found on network` });
  
  let result = { target, hostname: host.hostname, os: host.os };
  
  if (scanType === 'quick') {
    result.openPorts = host.ports;
  } else if (scanType === 'service') {
    result.services = host.services;
  } else if (scanType === 'aggressive') {
    result.openPorts = host.ports;
    result.services = host.services;
    result.os = host.os;
    result.vulnerabilities = host.ports.includes(21) ? ['Anonymous FTP'] : [];
    if (host.services[6379]) result.vulnerabilities.push('Redis No Auth');
    if (host.services[27017]) result.vulnerabilities.push('MongoDB No Auth');
  }
  
  res.json({ success: true, result });
});

router.get('/dns-enum', (req, res) => {
  res.render('labs/network/dns-enum', { title: 'DNS Enumeration', labId: 'network-scan' });
});

router.post('/dns-enum/lookup', (req, res) => {
  const { domain, type } = req.body;
  
  const dnsRecords = {
    'elitehacklab.local': {
      A: [{ name: 'elitehacklab.local', value: '192.168.1.10' }, { name: 'mail.elitehacklab.local', value: '192.168.1.11' }],
      MX: [{ name: 'elitehacklab.local', value: 'mail.elitehacklab.local', priority: 10 }],
      TXT: [{ name: 'elitehacklab.local', value: 'v=spf1 include:_spf.google.com ~all' }, { name: '_dmarc.elitehacklab.local', value: 'v=DMARC1; p=none' }],
      NS: [{ name: 'elitehacklab.local', value: 'ns1.elitehacklab.local' }, { name: 'elitehacklab.local', value: 'ns2.elitehacklab.local' }],
      AXFR: [
        { name: 'admin.elitehacklab.local', value: '192.168.1.10' },
        { name: 'dev.elitehacklab.local', value: '192.168.1.50' },
        { name: 'secret.elitehacklab.local', value: '192.168.1.254' },
        { name: 'vpn.elitehacklab.local', value: '192.168.1.5' },
        { name: 'internal-api.elitehacklab.local', value: '192.168.1.30' },
        { name: 'FLAG.elitehacklab.local', value: 'FLAG{dns_zone_transfer}' },
      ]
    }
  };

  const records = dnsRecords[domain];
  if (!records) return res.json({ success: false, error: `Domain ${domain} not found` });
  
  if (type === 'AXFR') {
    res.json({ success: true, message: 'Zone transfer allowed! (misconfiguration)', records: records.AXFR });
  } else {
    res.json({ success: true, records: records[type] || [] });
  }
});

router.get('/packet-analysis', (req, res) => { res.render('labs/network/packet-analysis', { title: 'Packet Analysis', labId: 'network-scan' }); });
router.get('/mitm', (req, res) => { res.render('labs/network/mitm', { title: 'MITM Concepts', labId: 'network-scan' }); });
router.get('/arp', (req, res) => { res.render('labs/network/arp', { title: 'ARP Spoofing', labId: 'network-scan' }); });

// Simulated packet capture data
router.get('/packet-analysis/capture', (req, res) => {
  const packets = [
    { id: 1, time: '0.000', src: '192.168.1.50', dst: '192.168.1.10', protocol: 'TCP', info: 'SYN → port 80' },
    { id: 2, time: '0.001', src: '192.168.1.10', dst: '192.168.1.50', protocol: 'TCP', info: 'SYN-ACK ← port 80' },
    { id: 3, time: '0.002', src: '192.168.1.50', dst: '192.168.1.10', protocol: 'HTTP', info: 'GET /login HTTP/1.1' },
    { id: 4, time: '0.050', src: '192.168.1.50', dst: '192.168.1.10', protocol: 'HTTP', info: 'POST /login username=admin&password=P@ssw0rd123' },
    { id: 5, time: '0.100', src: '192.168.1.10', dst: '192.168.1.50', protocol: 'HTTP', info: 'Set-Cookie: session=abc123def456' },
    { id: 6, time: '1.000', src: '192.168.1.50', dst: '8.8.8.8', protocol: 'DNS', info: 'Query: secret-api.internal.com' },
    { id: 7, time: '2.000', src: '192.168.1.50', dst: '192.168.1.30', protocol: 'MySQL', info: 'Login: root/root → Success' },
    { id: 8, time: '3.000', src: '192.168.1.20', dst: '192.168.1.50', protocol: 'FTP', info: 'USER anonymous → 230 Login OK' },
    { id: 9, time: '4.000', src: '192.168.1.50', dst: '192.168.1.254', protocol: 'HTTPS', info: 'TLS handshake → secret-server' },
    { id: 10, time: '5.000', src: '192.168.1.100', dst: '255.255.255.255', protocol: 'ARP', info: 'Who has 192.168.1.1? Tell 192.168.1.100' },
  ];
  res.json({ packets, flag_hint: 'Find credentials in the HTTP traffic: FLAG{packet_sniffed}' });
});

module.exports = router;
