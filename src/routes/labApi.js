// ============================================================
// EliteHackLab - Unified Lab API (/api/labs/*)
// ============================================================
// Implements all interactive backend endpoints used by the lab
// frontend pages. Every flag returned here is pulled from the
// canonical registry (db/flags.js) so it always matches what the
// /api/flags/submit endpoint accepts.
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const FLAGS = require('../../db/flags');

// helper: get canonical flag value for a lab id
const F = (id) => (FLAGS[id] ? FLAGS[id].flag : 'FLAG{unknown}');

// ---------------------------------------------------------------
// NETWORK SECURITY
// ---------------------------------------------------------------
const NET_HOSTS = {
  '10.0.0.5':      [{ port: 22, state: 'open', service: 'ssh', version: 'OpenSSH 8.2' }, { port: 80, state: 'open', service: 'http', version: 'Apache 2.4.41' }, { port: 443, state: 'open', service: 'https', version: 'Apache 2.4.41' }],
  '192.168.1.1':   [{ port: 53, state: 'open', service: 'domain', version: 'dnsmasq 2.80' }, { port: 80, state: 'open', service: 'http', version: 'nginx 1.18' }],
  '192.168.1.254': [{ port: 22, state: 'open', service: 'ssh', version: 'OpenSSH 7.9' }, { port: 4444, state: 'open', service: 'metasploit', version: 'handler' }, { port: 8443, state: 'open', service: 'https-admin', version: 'SecretAdmin ' + F('network-port-scan') }],
};

router.post('/network/port-scan', (req, res) => {
  const { target, scanType } = req.body;
  const host = NET_HOSTS[target];
  if (!host) return res.json({ error: `Host ${target} appears down or filtered. Try 10.0.0.5, 192.168.1.1, or scan the whole /24.` });
  let results = host;
  if (scanType === 'quick') results = host.map(p => ({ port: p.port, state: p.state, service: p.service, version: '' }));
  res.json({ results });
});

router.post('/network/dns-enum', (req, res) => {
  const { recordType } = req.body;
  const records = {
    A: ['hacklab.local. 3600 IN A 10.0.0.5', 'www.hacklab.local. 3600 IN A 10.0.0.5'],
    MX: ['hacklab.local. 3600 IN MX 10 mail.hacklab.local.'],
    TXT: ['hacklab.local. IN TXT "v=spf1 include:_spf.google.com ~all"', '_secret.hacklab.local. IN TXT "' + F('network-dns-enum') + '"'],
    NS: ['hacklab.local. IN NS ns1.hacklab.local.', 'hacklab.local. IN NS ns2.hacklab.local.'],
    AXFR: ['; Zone transfer allowed (MISCONFIGURATION!)', 'admin.hacklab.local. IN A 192.168.1.254', 'dev.hacklab.local. IN A 192.168.1.50', 'vpn.hacklab.local. IN A 192.168.1.5', '_secret.hacklab.local. IN TXT "' + F('network-dns-enum') + '"'],
  };
  res.json({ records: records[recordType] || [] });
});

router.post('/network/arp', (req, res) => {
  const { victim, gateway } = req.body;
  res.json({
    message: `ARP cache of ${victim || '192.168.1.100'} poisoned — gateway ${gateway || '192.168.1.1'} now maps to attacker MAC. ${F('network-arp')}`,
    packets: [
      `ARP reply ${gateway || '192.168.1.1'} is-at AA:BB:CC:DD:EE:03 (attacker)`,
      `ARP reply ${victim || '192.168.1.100'} is-at AA:BB:CC:DD:EE:03 (attacker)`,
      'Traffic now flows through the attacker (bidirectional).'
    ]
  });
});

router.post('/network/mitm', (req, res) => {
  if (req.body.action === 'capture') {
    return res.json({ captured: [
      'GET /login HTTP/1.1  Host: 192.168.1.20',
      'POST /login  user=alice&pass=Sup3rS3cret!',
      'HTTP/1.1 200 OK  Set-Cookie: session=8f3a...',
      'Secret message intercepted: ' + F('network-mitm')
    ]});
  }
  res.json({ message: 'IP forwarding enabled, ARP spoofing active between Alice and Bob. Now capture traffic.' });
});


// ---------------------------------------------------------------
// CLOUD SECURITY
// ---------------------------------------------------------------
const S3_BUCKETS = {
  'hacklab-assets': ['logo.png', 'index.html', 'style.css'],
  'hacklab-dev': ['.env', 'docker-compose.yml', 'terraform.tfstate', 'flag.txt'],
  'hacklab-backup': ['db-backup-2024.sql', 'users-export.csv', 'id_rsa', 'flag.txt'],
};
router.post('/cloud/s3', (req, res) => {
  const bucket = (req.body.bucket || '').trim();
  const files = S3_BUCKETS[bucket];
  if (!files) return res.json({ error: 'NoSuchBucket / AccessDenied. Try hacklab-assets, hacklab-dev, hacklab-backup.' });
  const hasSecret = files.includes('flag.txt') || files.includes('.env');
  res.json({ files: files.map(f => `2024-01-15 10:00  ${f}`), flag: hasSecret ? F('cloud-s3') : undefined });
});

const IMDS = {
  '/latest/meta-data/': { content: 'ami-id\ninstance-id\ninstance-type\nlocal-ipv4\nhostname\niam/', links: ['/latest/meta-data/iam/', '/latest/meta-data/hostname'] },
  '/latest/meta-data/iam/': { content: 'security-credentials/', links: ['/latest/meta-data/iam/security-credentials/'] },
  '/latest/meta-data/iam/security-credentials/': { content: 'admin-role', links: ['/latest/meta-data/iam/security-credentials/admin-role'] },
  '/latest/meta-data/iam/security-credentials/admin-role': { content: JSON.stringify({ AccessKeyId: 'ASIAFAKEKEY123', SecretAccessKey: 'wJalrFAKE/secret', Token: F('cloud-metadata') }, null, 2), links: [] },
  '/latest/meta-data/hostname': { content: 'ip-10-0-1-50.internal', links: [] },
};
router.post('/cloud/metadata', (req, res) => {
  const path = (req.body.path || '/latest/meta-data/').trim();
  const node = IMDS[path];
  if (!node) return res.json({ error: '404 - Not Found. Start at /latest/meta-data/ and follow the links.' });
  res.json({ content: node.content, links: node.links });
});

router.post('/cloud/iam', (req, res) => {
  const cmd = (req.body.command || '').toLowerCase();
  if (cmd.includes('attach') && cmd.includes('admin')) return res.json({ output: 'AdministratorAccess policy attached to your user. You are now admin!\n' + F('cloud-iam') });
  if (cmd.includes('assume-role') && cmd.includes('admin')) return res.json({ output: 'Assumed role arn:aws:iam::admin. Temp creds issued.\n' + F('cloud-iam') });
  if (cmd.includes('list-attached-user-policies')) return res.json({ output: 'AttachedPolicies:\n - PowerUserAccess\n - iam:AttachUserPolicy (MISCONFIG! you can attach any policy)' });
  if (cmd.includes('get-user')) return res.json({ output: 'User: lowpriv-user  Arn: arn:aws:iam::123456789012:user/lowpriv-user' });
  res.json({ output: 'Command executed. Enumerate policies (list-attached-user-policies), then attach AdministratorAccess.' });
});

router.post('/cloud/container', (req, res) => {
  const cmd = (req.body.command || '').toLowerCase();
  if (cmd.includes('docker.sock')) return res.json({ output: 'srw-rw---- 1 root docker /var/run/docker.sock\nDocker socket mounted! Launch a privileged container mounting host / to escape.\n' + F('cloud-container') });
  if (cmd.includes('capsh') || cmd.includes('cap')) return res.json({ output: 'Current: cap_sys_admin,cap_net_admin=ep\nCAP_SYS_ADMIN present! You can mount host filesystems / escape.\n' + F('cloud-container') });
  if (cmd.includes('cgroup') || cmd.includes('dockerenv')) return res.json({ output: '/.dockerenv exists — you are inside a container. Look for the mounted docker.sock.' });
  if (cmd.trim() === 'id') return res.json({ output: 'uid=0(root) gid=0(root) groups=0(root)  # root INSIDE the container' });
  res.json({ output: 'Try: ls -la /var/run/docker.sock  OR  capsh --print' });
});

router.post('/cloud/serverless', (req, res) => {
  const data = req.body.eventData || '';
  if (/process\.env|require\(|child_process|\/flag/i.test(data)) {
    return res.json({ statusCode: 200, body: 'Injection executed', env: { FLAG: F('cloud-serverless'), AWS_SECRET_ACCESS_KEY: 'wJalrFAKE', DB_URL: 'mongodb://admin:pass@db:27017' } });
  }
  res.json({ statusCode: 200, body: 'Hello from Lambda. Hint: the function eval()s the "name" field — inject process.env.' });
});


// ---------------------------------------------------------------
// CRYPTOGRAPHY
// ---------------------------------------------------------------
router.post('/crypto/weak-hash', (req, res) => {
  const { hash, plaintext } = req.body;
  if (!hash || plaintext === undefined) return res.json({ match: false });
  const md5 = crypto.createHash('md5').update(String(plaintext)).digest('hex');
  const sha1 = crypto.createHash('sha1').update(String(plaintext)).digest('hex');
  const match = (md5 === hash || sha1 === hash);
  res.json({ match, flag: match ? F('crypto-weak-hash') : undefined });
});

// ECB byte-at-a-time oracle: AES-128-ECB, appends secret (the flag) then encrypts
const ECB_KEY = crypto.createHash('md5').update('elite-ecb-key').digest(); // 16 bytes
router.post('/crypto/ecb-mode', (req, res) => {
  let input = req.body.plaintext || '';
  let buf;
  try { buf = req.body.hexMode ? Buffer.from(input, 'hex') : Buffer.from(input, 'utf8'); }
  catch (e) { buf = Buffer.from(input, 'utf8'); }
  const secret = Buffer.from(F('crypto-ecb'), 'utf8');
  const cipher = crypto.createCipheriv('aes-128-ecb', ECB_KEY, null);
  const ct = Buffer.concat([cipher.update(Buffer.concat([buf, secret])), cipher.final()]);
  res.json({ ciphertext: ct.toString('hex') });
});

// Padding oracle: real AES-128-CBC decrypt, reports PKCS#7 padding validity
const PO_KEY = crypto.createHash('md5').update('elite-po-key').digest();
router.post('/crypto/padding-oracle', (req, res) => {
  try {
    const iv = Buffer.from(req.body.iv, 'hex');
    const ct = Buffer.from(req.body.ciphertext, 'hex');
    if (iv.length !== 16 || ct.length % 16 !== 0) return res.json({ validPadding: false });
    const decipher = crypto.createDecipheriv('aes-128-cbc', PO_KEY, iv);
    decipher.setAutoPadding(true);
    Buffer.concat([decipher.update(ct), decipher.final()]);
    res.json({ validPadding: true });
  } catch (e) { res.json({ validPadding: false }); }
});

// XOR key reuse: C1 XOR C2 XOR knownP2 = P1
router.post('/crypto/key-reuse', (req, res) => {
  try {
    const c1 = Buffer.from(req.body.c1, 'hex');
    const c2 = Buffer.from(req.body.c2, 'hex');
    const known = Buffer.from(req.body.knownPlaintext || '', 'utf8');
    const n = Math.min(c1.length, c2.length);
    const xored = Buffer.alloc(n);
    const plain = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      xored[i] = c1[i] ^ c2[i];
      plain[i] = known[i] !== undefined ? (xored[i] ^ known[i]) : xored[i];
    }
    res.json({ xored: xored.toString('hex'), plaintext: plain.toString('utf8') });
  } catch (e) { res.json({ error: e.message }); }
});

// Weak RNG: Linear Congruential Generator seeded once, predictable
let rngState = (Date.now() >>> 0) % 2147483647;
function lcgNext() { rngState = (rngState * 1103515245 + 12345) & 0x7fffffff; return rngState; }
let rngLast = null;
router.get('/crypto/rng', (req, res) => {
  const token = lcgNext().toString(16);
  rngLast = rngState;
  res.json({ token, timestamp: Date.now(), note: 'LCG: state = (state*1103515245 + 12345) & 0x7fffffff' });
});
router.post('/crypto/rng', (req, res) => {
  const predictedNext = ((rngLast * 1103515245 + 12345) & 0x7fffffff).toString(16);
  const correct = String(req.body.predicted).trim() === predictedNext;
  if (correct) rngLast = (rngLast * 1103515245 + 12345) & 0x7fffffff;
  res.json({ correct, flag: correct ? F('crypto-rng') : undefined, expected: correct ? undefined : '(compute it yourself!)' });
});


// ---------------------------------------------------------------
// SOCIAL ENGINEERING
// ---------------------------------------------------------------
const PHISH_ANSWERS = { 1: true, 2: false, 3: true, 4: true, 5: false };
const PHISH_WHY = {
  1: 'Lookalike domain g00gle.com + urgency + suspicious link = phishing',
  2: 'Legitimate github.com notification, no action required = safe',
  3: 'paypa1.com (L->1) + .tk link + fear tactic = phishing',
  4: 'Internal IP password reset over HTTP = phishing',
  5: 'Real amazon.com AWS billing notice = safe',
};
router.post('/social/phishing', (req, res) => {
  const answers = req.body.answers || {};
  let correct = 0; const details = [];
  Object.keys(PHISH_ANSWERS).forEach(id => {
    const ok = answers[id] === PHISH_ANSWERS[id];
    if (ok) correct++;
    details.push({ id, correct: ok, explanation: PHISH_WHY[id] });
  });
  const total = Object.keys(PHISH_ANSWERS).length;
  res.json({ correct, total, details, flag: correct === total ? F('social-phishing') : undefined });
});

router.post('/social/email-headers', (req, res) => {
  const ipOk = (req.body.senderIp || '').trim() === '185.100.87.42';
  const spoofOk = (req.body.spoofed || '') === 'yes';
  if (ipOk && spoofOk) return res.json({ correct: true, message: 'Correct! True origin 185.100.87.42, SPF/DKIM/DMARC all failed = spoofed. ' + F('social-email-headers') });
  res.json({ correct: false, message: 'Not quite. Trace the earliest Received header and check the auth results.' });
});

router.post('/social/osint', (req, res) => {
  const { tool, query } = req.body;
  const out = {
    whois: `Domain: ${query}\nRegistrant: HackCorp Inc.\nAdmin email: admin@hackcorp.com\nName servers: ns1.hackcorp.com`,
    'google-dork': 'site:hackcorp.com filetype:pdf ->\n  /docs/onboarding.pdf (mentions VPN portal vpn.hackcorp.com)\n  /hr/employees.xlsx (leaked employee list)',
    shodan: 'Exposed services for hackcorp.com:\n  20.30.40.50:3389 RDP (outdated)\n  20.30.40.51:9200 Elasticsearch (no auth!)',
    github: 'Found repo hackcorp/api-config with committed .env:\n  DB_PASS=Summer2024!\n  ' + F('social-osint'),
    pastebin: 'Leaked paste "hackcorp dump":\n  admin@hackcorp.com:Summer2024!\n  ' + F('social-osint'),
  };
  res.json({ results: out[tool] || 'No results for that tool.' });
});

router.post('/social/pretexting', (req, res) => {
  const msg = (req.body.message || '').toLowerCase();
  const persona = req.body.persona || '';
  const authority = /ceo|urgent|immediately|executive|manager|director|asap/.test(msg);
  const askCreds = /password|reset|access|credential|account/.test(msg);
  if ((persona === 'executive' || persona === 'it-admin') && authority && askCreds) {
    return res.json({ response: 'Help Desk: "Of course, right away! I\'ve reset it — temporary password is Welcome@123. Anything else?"', flag: F('social-pretexting') });
  }
  res.json({ response: 'Help Desk: "I\'m sorry, I can\'t verify your identity for that request. Can you open a ticket?" (Try more authority + urgency + a credential request.)' });
});

// ---------------------------------------------------------------
// MOBILE SECURITY
// ---------------------------------------------------------------
const MOBILE_FS = {
  '/data/data/com.hacklab.app/': { listing: 'shared_prefs/\ndatabases/\nfiles/\ncache/' },
  '/data/data/com.hacklab.app/shared_prefs/': { listing: 'auth.xml\nuser_prefs.xml' },
  '/data/data/com.hacklab.app/shared_prefs/auth.xml': { content: '<map>\n  <string name="username">victim</string>\n  <string name="password">S3cr3tP@ss!</string>\n  <string name="token">' + F('mobile-insecure-storage') + '</string>\n</map>' },
  '/data/data/com.hacklab.app/databases/': { listing: 'users.db\ncache.db' },
};
router.post('/mobile/insecure-storage', (req, res) => {
  const node = MOBILE_FS[(req.body.path || '').trim()];
  if (!node) return res.json({ content: 'No such path. Start at /data/data/com.hacklab.app/ and open shared_prefs/auth.xml' });
  res.json(node);
});

router.post('/mobile/api-hardcoded', (req, res) => {
  const strings = [
    'res/values/strings.xml: <string name="api_base">https://api.hacklab.com</string>',
    'BuildConfig.java: public static final String API_KEY = "sk_live_9x8f7e6d5c4b";',
    'BuildConfig.java: public static final String SECRET = "' + F('mobile-api-hardcoded') + '";',
    'AndroidManifest.xml: android:debuggable="true"',
  ];
  const pat = req.body.pattern || '';
  let out = strings;
  try { const re = new RegExp(pat, 'i'); out = strings.filter(s => re.test(s)); } catch (e) {}
  res.json({ results: (out.length ? out : strings).join('\n') });
});

router.post('/mobile/cert-pinning', (req, res) => {
  const s = (req.body.script || '');
  if (/return true|implementation|verify/i.test(s)) {
    return res.json({ output: '[*] Certificate pinning bypassed!\n[*] Intercepting HTTPS...', intercepted: 'GET /api/secret HTTP/1.1\nHost: api.hacklab.com\n\n200 OK { "flag": "' + F('mobile-cert-pinning') + '" }' });
  }
  res.json({ output: '[!] Script loaded but pinning still active. Hook the verify() method to return true.' });
});

router.post('/mobile/deep-links', (req, res) => {
  const url = req.body.url || '';
  if (/redirect=https?:\/\/|redirect=\/\//i.test(url)) return res.json({ result: 'App opened WebView to attacker URL (open redirect via deep link)! ' + F('mobile-deep-links') });
  if (/\/admin|token=|reset-password\?token=/i.test(url)) return res.json({ result: 'Deep link bypassed auth and reached a protected screen! ' + F('mobile-deep-links') });
  res.json({ result: 'Deep link handled normally. Try abusing the redirect= parameter or /admin path.' });
});


// ---------------------------------------------------------------
// FORENSICS
// ---------------------------------------------------------------
router.post('/forensics/stego', (req, res) => {
  const { tool, password } = req.body;
  const out = {
    strings: 'JFIF...\nCreated with GIMP\n(nothing obvious — try metadata or LSB)',
    exiftool: 'Comment: "The key is hidden below the surface"\nSoftware: steghide 0.5.1',
    binwalk: 'DECIMAL   HEXADECIMAL   DESCRIPTION\n0         0x0           JPEG image\n45120     0xB040        Zip archive, contains: secret.txt',
    steghide: password ? ('wrote extracted data to "secret.txt":\n' + F('forensics-stego')) : 'could not extract: passphrase required (hint from exiftool?)',
    lsb: 'LSB channel (RGB) extraction:\n' + F('forensics-stego'),
  };
  res.json({ output: out[tool] || 'Unknown tool' });
});

const LOGS = [
  '185.100.87.42 - - "GET /login" 200',
  '185.100.87.42 - - "POST /login" 401  (x500 rapid attempts)',
  "185.100.87.42 - - \"GET /products?id=1' OR '1'='1\" 200",
  '185.100.87.42 - - "GET /admin" 200',
  '185.100.87.42 - - "GET /download?file=../../etc/passwd" 200',
  '10.0.0.9 - - "GET /index.html" 200',
];
router.post('/forensics/log-analysis', (req, res) => {
  const f = req.body.filter;
  let logs = LOGS;
  if (f === '4xx') logs = LOGS.filter(l => / 4\d\d/.test(l));
  else if (f === 'sql') logs = LOGS.filter(l => /'|OR|=/.test(l) && /id=/.test(l));
  else if (f === 'brute') logs = LOGS.filter(l => /login/.test(l));
  res.json({ logs: logs.join('\n') });
});
router.post('/forensics/log-analysis/verify', (req, res) => {
  const ipOk = (req.body.attackerIp || '').trim() === '185.100.87.42';
  const typeOk = /sql/i.test(req.body.attackType || '');
  if (ipOk && typeOk) return res.json({ correct: true, message: 'Correct! 185.100.87.42 ran SQL injection + brute force + LFI. ' + F('forensics-log-analysis') });
  res.json({ correct: false, message: 'Look for the IP with 500 failed logins and a SQL injection payload.' });
});

router.post('/forensics/memory', (req, res) => {
  const c = req.body.command;
  const out = {
    pslist: 'PID   Name\n4      System\n1337   .hidden_bd.exe  <- suspicious\n1338   nc.exe',
    netscan: '192.168.1.50:54321 -> 185.100.87.42:4444 ESTABLISHED (reverse shell)',
    cmdline: '1337  .hidden_bd.exe -c 185.100.87.42',
    hashdump: 'Administrator:500:aad3b...:31d6cfe0d16ae931b73c59d7e0c089c0:::\nrecovered plaintext: ' + F('forensics-memory'),
    filescan: '0x... \\Device\\...\\flag.txt',
    dumpfiles: 'Dumped flag.txt -> ' + F('forensics-memory'),
  };
  res.json({ output: out[c] || 'Unknown command' });
});

router.post('/forensics/encoding', (req, res) => {
  const { input, type } = req.body;
  let decoded = '';
  try {
    if (type === 'base64') decoded = Buffer.from(input, 'base64').toString('utf8');
    else if (type === 'hex') decoded = Buffer.from(input.replace(/\s/g, ''), 'hex').toString('utf8');
    else if (type === 'rot13') decoded = input.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c.charCodeAt(0) + 13) ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13));
    else if (type === 'binary') decoded = input.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
    else if (type === 'url') decoded = decodeURIComponent(input);
  } catch (e) { decoded = 'Decode error: ' + e.message; }
  res.json({ decoded });
});

router.post('/forensics/binary', (req, res) => {
  const out = {
    disasm: 'main:\n  ... \n  lea rax,[rip+password]   ; "sup3r_s3cr3t"\n  call strcmp\n  test eax,eax\n  jne  fail\n  call print_flag',
    strings: 'Enter password:\nsup3r_s3cr3t\nWrong!\nCorrect! Flag: (run with correct password)',
    ltrace: 'strcmp("input", "sup3r_s3cr3t") = ...',
    strace: 'read(0, "input", 128)  write(1, "Wrong!\\n", 7)',
  };
  res.json({ output: out[req.body.tool] || 'Unknown tool' });
});
router.post('/forensics/binary/run', (req, res) => {
  const ok = (req.body.input || '') === 'sup3r_s3cr3t';
  res.json({ success: ok, output: ok ? ('Correct! ' + F('forensics-binary')) : 'Wrong! Access denied.' });
});


// ---------------------------------------------------------------
// PRIVILEGE ESCALATION
// ---------------------------------------------------------------
router.post('/privesc/suid', (req, res) => {
  const c = (req.body.command || '').toLowerCase();
  if (/find .*-exec|vim .*!|python.*os\.|nmap.*interactive|bash -p|awk.*system/.test(c) || /find|vim|python|nmap/.test(c) && /sh|bash|exec/.test(c)) {
    return res.json({ output: '# id\nuid=0(root) gid=0(root)\nRoot shell via SUID binary! ' + F('privesc-suid') });
  }
  res.json({ output: 'Command ran as your user. Use a GTFOBins technique on an exploitable SUID binary (find/vim/python).' });
});

router.post('/privesc/cron', (req, res) => {
  const target = req.body.target || '';
  if (/\/opt\/scripts\/(backup|cleanup)\.sh|\/tmp\//.test(target)) {
    return res.json({ success: true, output: 'Payload written to world-writable cron script. On next run (as root): /tmp/rootbash -p\n' + F('privesc-cron') });
  }
  res.json({ success: false, error: 'That path is not writable by your user. Find a world-writable script in /opt/scripts or /tmp.' });
});

router.post('/privesc/sudo', (req, res) => {
  const c = (req.body.command || '').toLowerCase();
  if (/vim|find|awk|env|python|less|man|nmap/.test(c)) {
    return res.json({ output: '# whoami\nroot\nRoot shell obtained via sudo GTFOBins! ' + F('privesc-sudo') });
  }
  res.json({ output: 'sudo: a password is required, or that binary has no known GTFOBins escape. Check sudo -l output above.' });
});

router.post('/privesc/kernel', (req, res) => {
  // The simulated box is old (Linux 3.13 / Ubuntu 14.04) -> DirtyCOW / OverlayFS work
  const e = req.body.exploit;
  if (e === 'dirtycow' || e === 'overlayfs') {
    return res.json({ success: true, output: '[*] Compiling exploit...\n[*] Racing...\n[+] Success! # id -> uid=0(root)\n' + F('privesc-kernel') });
  }
  res.json({ success: false, output: '[-] Exploit failed: kernel not vulnerable to this CVE. Check `uname -a` (this is a 3.13 kernel).' });
});

router.post('/privesc/path', (req, res) => {
  const payload = req.body.payload || '';
  if (/bash|sh|-p/.test(payload)) {
    return res.json({ success: true, output: 'Malicious "service" placed in ' + (req.body.pathDir || '/tmp') + ', PATH hijacked.\nRunning /usr/local/bin/status -> executes your binary as root!\n# id -> uid=0(root)\n' + F('privesc-path') });
  }
  res.json({ success: false, output: 'PATH set, but your fake binary must spawn a shell (e.g. /bin/bash -p).' });
});

// ---------------------------------------------------------------
// API SECURITY
// ---------------------------------------------------------------
router.post('/api/mass-assignment', (req, res) => {
  const body = req.body || {};
  const isAdmin = body.role === 'admin' || body.isAdmin === true || body.isAdmin === 'true' || body.admin === true;
  const profile = Object.assign({ username: 'hacker', role: 'user' }, body);
  res.json({ updated: true, profile, flag: isAdmin ? F('api-mass-assignment') : undefined, note: isAdmin ? 'Privilege escalated!' : 'Profile updated. Try adding "role":"admin".' });
});

const OTP_CORRECT = '1337';
router.post('/api/rate-limit', (req, res) => {
  const ok = String(req.body.otp) === OTP_CORRECT;
  res.json({ success: ok, message: ok ? ('OTP correct! ' + F('api-rate-limit')) : `Invalid OTP ${req.body.otp}. (No rate limit — brute force it!)` });
});
router.post('/api/rate-limit/brute', (req, res) => {
  const otps = req.body.otps || [];
  if (otps.includes(OTP_CORRECT)) return res.json({ success: true, otp: OTP_CORRECT, flag: F('api-rate-limit') });
  res.json({ success: false });
});

router.post('/api/graphql', (req, res) => {
  const q = req.body.query || '';
  if (/__schema/.test(q)) {
    return res.json({ data: { __schema: { queryType: { name: 'Query' }, types: [
      { name: 'User', fields: [{ name: 'id' }, { name: 'username' }, { name: 'password' }, { name: 'role' }] },
      { name: 'Query', fields: [{ name: 'users' }, { name: 'getFlag' }] },
      { name: 'Mutation', fields: [{ name: 'promoteToAdmin' }] },
    ] } }, hint: 'Hidden query found: getFlag. Run: { getFlag }' });
  }
  if (/getflag/i.test(q)) return res.json({ data: { getFlag: F('api-graphql') } });
  if (/users/i.test(q)) return res.json({ data: { users: [{ id: 1, username: 'admin', role: 'admin' }] } });
  res.json({ data: null, errors: [{ message: 'Unknown query. Try introspection: { __schema { types { name } } }' }] });
});

router.post('/api/nosql', (req, res) => {
  const p = req.body.password;
  const injected = p !== null && typeof p === 'object' && (p.$ne !== undefined || p.$gt !== undefined || p.$regex !== undefined);
  if (injected && req.body.username === 'admin') return res.json({ success: true, user: 'admin', flag: F('api-nosql') });
  if (req.body.username === 'admin' && p === 'admin123') return res.json({ success: true, user: 'admin', note: 'Logged in normally.' });
  res.json({ success: false, note: 'Login failed. Try {"password":{"$ne":""}}.' });
});

const ADMIN_API_KEY = 'sk_live_hacklab_admin_9x8f7e6d';
router.get('/api/api-key', (req, res) => {
  const endpoint = req.query.endpoint || '';
  const key = req.headers['x-api-key'];
  if (endpoint === '/api/docs') return res.json({ endpoints: ['/api/public/info', '/api/admin/flag'], note: 'admin endpoints need X-API-Key (check the page source comments!)' });
  if (endpoint === '/api/public/info') return res.json({ app: 'HackLab', version: '1.0' });
  if (endpoint === '/api/admin/flag') {
    if (key === ADMIN_API_KEY) return res.json({ flag: F('api-key-exposure') });
    return res.status(401).json({ error: 'Invalid or missing X-API-Key' });
  }
  res.json({ error: 'Unknown endpoint' });
});


// ---------------------------------------------------------------
// ADVANCED
// ---------------------------------------------------------------
router.post('/advanced/clickjacking', (req, res) => {
  // The target page is intentionally served without X-Frame-Options / CSP
  res.json({ vulnerable: true, message: 'Target is framable (no X-Frame-Options / CSP frame-ancestors). A transparent iframe overlay would trick the click. ' + F('advanced-clickjacking') });
});

router.post('/advanced/cors', (req, res) => {
  const origin = req.body.origin || '';
  const reflected = !!origin; // vulnerable server reflects ANY origin
  res.json({
    vulnerable: reflected,
    headers: {
      'Access-Control-Allow-Origin': reflected ? origin : '(not set)',
      'Access-Control-Allow-Credentials': 'true',
    },
    data: reflected ? { username: 'victim', email: 'victim@corp.com', apiKey: 'sk_live_victim_123', flag: F('advanced-cors') } : undefined,
  });
});

router.post('/advanced/http-smuggling', (req, res) => {
  const payload = req.body.payload || '';
  const hasCL = /content-length/i.test(payload);
  const hasTE = /transfer-encoding/i.test(payload);
  const smuggledAdmin = /\/admin/i.test(payload);
  if (hasCL && hasTE && smuggledAdmin) {
    return res.json({ response: 'HTTP/1.1 200 OK\nFront-end saw one request, back-end processed two (desync).\nSmuggled GET /admin reached the back-end:\n\nAdmin panel: ' + F('advanced-http-smuggling') });
  }
  res.json({ error: 'No desync. You need BOTH Content-Length and Transfer-Encoding headers, and a smuggled GET /admin request.' });
});

router.post('/advanced/open-redirect', (req, res) => {
  const url = req.body.url || '';
  const external = /^https?:\/\/|^\/\/|^https?:\\|@/.test(url) && !/^\/(?!\/)/.test(url);
  res.json({ location: url, external, flag: external ? F('advanced-open-redirect') : undefined });
});

module.exports = router;
