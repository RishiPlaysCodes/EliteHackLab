const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');
const { URL } = require('url');

// SSRF Labs Landing
router.get('/', (req, res) => {
  res.render('labs/ssrf/index', {
    title: 'Server-Side Request Forgery (SSRF) Labs',
    labs: [
      { id: 'basic', name: 'Basic SSRF', difficulty: 'Medium', path: '/labs/ssrf/basic' },
      { id: 'filter-bypass', name: 'SSRF Filter Bypass', difficulty: 'Hard', path: '/labs/ssrf/filter-bypass' },
      { id: 'blind', name: 'Blind SSRF', difficulty: 'Hard', path: '/labs/ssrf/blind' },
    ]
  });
});

// Simulated internal service (should not be externally accessible)
router.get('/internal/admin', (req, res) => {
  // This simulates an internal admin panel
  res.json({
    message: 'Internal Admin Panel',
    flag: 'FLAG{ssrf_internal_access}',
    secrets: {
      db_password: 'internal_db_pass_2024',
      api_key: 'sk-internal-master-key'
    }
  });
});

router.get('/internal/metadata', (req, res) => {
  // Simulates cloud metadata endpoint (like AWS 169.254.169.254)
  res.json({
    'instance-id': 'i-0123456789abcdef',
    'ami-id': 'ami-hacker123',
    'iam-role': 'admin-role',
    'security-credentials': {
      'AccessKeyId': 'AKIA_FAKE_KEY_FOR_LAB',
      'SecretAccessKey': 'fake_secret_key_for_lab',
      'Token': 'FLAG{ssrf_internal_access}'
    }
  });
});

// Lab 1: Basic SSRF - URL Fetcher
router.get('/basic', (req, res) => {
  res.render('labs/ssrf/basic', {
    title: 'Basic SSRF',
    labId: 'ssrf-basic',
    result: null,
    url: ''
  });
});

router.post('/basic/fetch', (req, res) => {
  const { url } = req.body;
  
  // INTENTIONALLY VULNERABLE - No URL validation
  try {
    const parsedUrl = new URL(url);
    
    // Simulate fetching the URL (for internal lab URLs, return directly)
    if (url.includes('/labs/ssrf/internal/')) {
      // Fetch from own server
      const path = parsedUrl.pathname;
      const internalReq = http.request({
        hostname: 'localhost',
        port: req.socket.localPort || 3000,
        path: path,
        method: 'GET'
      }, (internalRes) => {
        let data = '';
        internalRes.on('data', chunk => data += chunk);
        internalRes.on('end', () => {
          res.json({ success: true, data: data, url: url });
        });
      });
      internalReq.on('error', (e) => {
        res.json({ success: false, error: e.message });
      });
      internalReq.end();
    } else if (url.includes('169.254.169.254') || url.includes('localhost') || url.includes('127.0.0.1')) {
      // Simulate metadata/internal access
      res.json({
        success: true,
        data: JSON.stringify({
          message: 'Internal service accessed via SSRF!',
          flag: 'FLAG{ssrf_internal_access}',
          note: 'In real scenarios, this would access cloud metadata, internal services, etc.'
        }),
        url: url
      });
    } else {
      res.json({
        success: true,
        data: `Fetched content from: ${url} (external fetch simulated)`,
        url: url
      });
    }
  } catch (e) {
    res.json({ success: false, error: `Invalid URL: ${e.message}` });
  }
});

// Lab 2: SSRF with filters
router.get('/filter-bypass', (req, res) => {
  res.render('labs/ssrf/filter-bypass', {
    title: 'SSRF Filter Bypass',
    labId: 'ssrf-basic',
    result: null
  });
});

router.post('/filter-bypass/fetch', (req, res) => {
  const { url } = req.body;
  
  // Weak filter - can be bypassed with encoding, redirects, DNS rebinding
  const blocked = ['127.0.0.1', 'localhost', '0.0.0.0'];
  const isBlocked = blocked.some(b => url.toLowerCase().includes(b));
  
  if (isBlocked) {
    return res.json({ success: false, error: 'Blocked: Internal addresses not allowed' });
  }
  
  // But doesn't check: 0x7f000001, 2130706433, [::1], 127.0.0.0/8, etc.
  try {
    const parsedUrl = new URL(url);
    
    // Check for bypass patterns
    if (parsedUrl.hostname === '0x7f.0x0.0x0.0x1' || 
        parsedUrl.hostname === '0177.0.0.01' ||
        parsedUrl.hostname === '[::1]' ||
        parsedUrl.hostname.endsWith('.127.0.0.1.nip.io') ||
        url.includes('2130706433')) {
      res.json({
        success: true,
        data: JSON.stringify({ flag: 'FLAG{ssrf_internal_access}', message: 'Filter bypassed!' }),
        bypass_used: parsedUrl.hostname
      });
    } else {
      res.json({ success: true, data: `Fetched: ${url}`, note: 'Try to bypass the filter to access internal services' });
    }
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Lab 3: Blind SSRF
router.get('/blind', (req, res) => {
  res.render('labs/ssrf/blind', {
    title: 'Blind SSRF',
    labId: 'ssrf-basic'
  });
});

router.post('/blind/webhook', (req, res) => {
  const { webhook_url } = req.body;
  
  // Simulates sending data to a webhook (blind SSRF)
  // In reality would make an outbound request
  res.json({
    success: true,
    message: `Notification sent to: ${webhook_url}`,
    note: 'The server made an outbound request to your URL. Use a webhook catcher to see it.',
    hint: 'Try pointing to internal services like http://localhost:3000/labs/ssrf/internal/admin'
  });
});

module.exports = router;
