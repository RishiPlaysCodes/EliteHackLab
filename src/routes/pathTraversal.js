const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Path Traversal Labs Landing
router.get('/', (req, res) => {
  res.render('labs/pathtraversal/index', {
    title: 'Path Traversal / LFI Labs',
    labs: [
      { id: 'basic', name: 'Basic Path Traversal', difficulty: 'Medium', path: '/labs/path-traversal/basic' },
      { id: 'filter-bypass', name: 'Filter Bypass', difficulty: 'Hard', path: '/labs/path-traversal/filter-bypass' },
      { id: 'lfi', name: 'Local File Inclusion', difficulty: 'Hard', path: '/labs/path-traversal/lfi' },
    ]
  });
});

// Create fake filesystem for the lab
const fakeFs = {
  '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nFLAG{path_traversal_lfi}\n',
  '/etc/shadow': 'root:$6$rounds=656000$fake$hash:18000:0:99999:7:::\nFLAG{path_traversal_lfi}\n',
  '/etc/hosts': '127.0.0.1 localhost\n192.168.1.100 internal-server\n10.0.0.5 database-server\n',
  '/proc/self/environ': 'PATH=/usr/local/bin:/usr/bin\nSERVER_SECRET=FLAG{path_traversal_lfi}\nDB_PASSWORD=super_secret_123\n',
  '/var/log/auth.log': 'Jul 15 10:23:01 server sshd[1234]: Failed password for admin from 192.168.1.50\nJul 15 10:23:05 server sshd[1234]: Accepted password for admin\n',
  '/app/config.js': 'module.exports = {\n  secret: "FLAG{path_traversal_lfi}",\n  db: "mongodb://admin:password123@localhost:27017"\n};\n',
  '/home/admin/.ssh/id_rsa': '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA_FAKE_KEY_FOR_LAB_PURPOSES\nFLAG{path_traversal_lfi}\n-----END RSA PRIVATE KEY-----\n'
};

// Lab files (safe to read)
const labFiles = {
  'about.txt': 'Welcome to EliteHackLab! This is the about page.',
  'readme.txt': 'This application serves files from the /documents directory.',
  'contact.txt': 'Contact us at: admin@elitehacklab.local',
  'secret.txt': 'This file should not be accessible! FLAG{path_traversal_lfi}'
};

// Lab 1: Basic Path Traversal
router.get('/basic', (req, res) => {
  res.render('labs/pathtraversal/basic', {
    title: 'Basic Path Traversal',
    labId: 'path-traversal',
    content: null,
    filename: '',
    files: Object.keys(labFiles)
  });
});

router.get('/basic/read', (req, res) => {
  const filename = req.query.file || '';
  
  // INTENTIONALLY VULNERABLE - No path sanitization
  // Check fake filesystem first
  if (filename.includes('..')) {
    // Resolve the traversal
    const traversed = path.normalize('/' + filename.replace(/\.\.\//g, '../'));
    const resolved = path.resolve('/documents', filename);
    
    // Check if they reached a fake system file
    for (const [fakePath, content] of Object.entries(fakeFs)) {
      if (filename.includes(fakePath.slice(1)) || resolved.includes(fakePath) || traversed === fakePath) {
        return res.json({ success: true, filename, content, resolved: fakePath });
      }
    }
    
    // Generic traversal detected
    return res.json({ 
      success: true, 
      filename, 
      content: `Path traversal detected! Resolved to: ${resolved}\nTry to reach /etc/passwd or /app/config.js\n`,
      hint: 'Use ../ to go up directories. Target: ../../../../etc/passwd'
    });
  }

  // Normal file read
  if (labFiles[filename]) {
    return res.json({ success: true, filename, content: labFiles[filename] });
  }

  res.json({ success: false, error: `File not found: ${filename}` });
});

// Lab 2: Filter Bypass
router.get('/filter-bypass', (req, res) => {
  res.render('labs/pathtraversal/filter-bypass', {
    title: 'Path Traversal - Filter Bypass',
    labId: 'path-traversal',
    content: null
  });
});

router.get('/filter-bypass/read', (req, res) => {
  let filename = req.query.file || '';
  
  // Weak filter - removes ../ once
  filename = filename.replace('../', '');
  
  // But doesn't handle: ....// , ..%2f, %2e%2e/, ..;/, etc.
  if (filename.includes('..') || filename.includes('%2e') || filename.includes('%2f')) {
    // Bypass detected
    for (const [fakePath, content] of Object.entries(fakeFs)) {
      if (filename.includes(fakePath.slice(1).split('/').pop())) {
        return res.json({ success: true, content, bypass: 'Filter bypassed!', flag: 'FLAG{path_traversal_lfi}' });
      }
    }
    return res.json({ success: true, content: 'Filter bypass detected! FLAG{path_traversal_lfi}', filename });
  }

  if (labFiles[filename]) {
    return res.json({ success: true, content: labFiles[filename] });
  }

  res.json({ success: false, error: `File not found: ${filename}`, filtered: filename });
});

// Lab 3: Local File Inclusion
router.get('/lfi', (req, res) => {
  const page = req.query.page || 'home';
  
  // Simulated LFI through template inclusion
  const pages = {
    'home': '<h2>Home</h2><p>Welcome to the application.</p>',
    'about': '<h2>About</h2><p>This is a demo application.</p>',
    'contact': '<h2>Contact</h2><p>Email: admin@lab.local</p>'
  };

  let content = pages[page];
  let lfiDetected = false;

  if (!content) {
    // Check if it's a traversal attempt
    if (page.includes('..') || page.includes('/etc') || page.includes('/proc')) {
      lfiDetected = true;
      for (const [fakePath, fileContent] of Object.entries(fakeFs)) {
        if (page.includes(fakePath) || page.includes(fakePath.slice(1))) {
          content = `<pre>${fileContent}</pre>`;
          break;
        }
      }
      if (!content) {
        content = `<pre>LFI Attempt: ${page}\nKeep trying! Target files:\n- /etc/passwd\n- /proc/self/environ\n- /app/config.js</pre>`;
      }
    } else {
      content = `<p>Page not found: ${page}</p>`;
    }
  }

  res.render('labs/pathtraversal/lfi', {
    title: 'Local File Inclusion',
    labId: 'path-traversal',
    page,
    content,
    lfiDetected
  });
});

module.exports = router;
