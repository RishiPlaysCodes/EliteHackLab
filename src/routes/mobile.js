const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/mobile/index', {
    title: 'Mobile Security Labs',
    labs: [
      { id: 'insecure-storage', name: 'Insecure Data Storage', difficulty: 'Easy', path: '/labs/mobile/insecure-storage' },
      { id: 'api-hardcoded', name: 'Hardcoded Secrets in APK', difficulty: 'Medium', path: '/labs/mobile/api-hardcoded' },
      { id: 'cert-pinning', name: 'Certificate Pinning Bypass', difficulty: 'Hard', path: '/labs/mobile/cert-pinning' },
      { id: 'deep-links', name: 'Deep Link Exploitation', difficulty: 'Medium', path: '/labs/mobile/deep-links' },
    ]
  });
});

// Lab 1: Insecure Storage
router.get('/insecure-storage', (req, res) => { res.render('labs/mobile/insecure-storage', { title: 'Insecure Data Storage', labId: 'mobile-storage' }); });

// Simulated mobile app API with insecure responses
router.get('/insecure-storage/data', (req, res) => {
  res.json({
    localStorage: {
      'user_token': 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.fake',
      'pin_code': '1234',
      'credit_card': '4532-XXXX-XXXX-7890',
      'password_plain': 'MyS3cur3P@ss!',
      'biometric_key': 'base64_encoded_key_here'
    },
    sharedPreferences: {
      'is_premium': 'true',
      'auth_token': 'sk-mobile-app-secret-token',
      'server_url': 'https://api.internal.company.com'
    },
    sqliteDB: {
      'users.db': 'Contains: username, password (plaintext), SSN, credit_cards',
      'cached_data.db': 'Contains: full API responses with PII'
    },
    flag: 'FLAG{insecure_mobile_storage}',
    vulnerabilities: ['Plaintext passwords', 'Unencrypted SQLite', 'Sensitive data in SharedPreferences', 'No data-at-rest encryption']
  });
});

// Lab 2: Hardcoded Secrets
router.get('/api-hardcoded', (req, res) => { res.render('labs/mobile/api-hardcoded', { title: 'Hardcoded Secrets', labId: 'mobile-storage' }); });

router.get('/api-hardcoded/decompile', (req, res) => {
  // Simulated decompiled APK strings
  res.json({
    stringsFromAPK: [
      'API_KEY=sk-prod-mobile-api-key-9876543',
      'AWS_ACCESS_KEY=AKIAFAKEKEY123456789',
      'AWS_SECRET=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      'FIREBASE_URL=https://project-12345.firebaseio.com',
      'DEBUG_ENDPOINT=https://debug-api.company.internal/admin',
      'ENCRYPTION_KEY=SuperSecretKey256bit!!!!!!!!!!!',
      'FLAG{hardcoded_secrets_found}'
    ],
    manifest: {
      exported_activities: ['com.app.DeepLinkActivity', 'com.app.DebugActivity'],
      permissions: ['INTERNET', 'READ_CONTACTS', 'CAMERA', 'READ_SMS', 'ACCESS_FINE_LOCATION'],
      debuggable: true
    }
  });
});

// Lab 3: Cert Pinning Bypass
router.get('/cert-pinning', (req, res) => { res.render('labs/mobile/cert-pinning', { title: 'Certificate Pinning', labId: 'mobile-storage' }); });

// Lab 4: Deep Links
router.get('/deep-links', (req, res) => { res.render('labs/mobile/deep-links', { title: 'Deep Link Exploitation', labId: 'mobile-storage' }); });

router.get('/deep-links/handle', (req, res) => {
  const { url, action, token } = req.query;
  // Simulated deep link handler - no validation
  if (action === 'login' && token) {
    res.json({ success: true, message: `Auto-login with token: ${token}`, flag: 'FLAG{deep_link_hijack}' });
  } else if (url) {
    res.json({ success: true, message: `WebView loading: ${url}`, xss_possible: true });
  } else {
    res.json({ hint: 'Try: ?action=login&token=stolen_token or ?url=javascript:alert(1)' });
  }
});

module.exports = router;
