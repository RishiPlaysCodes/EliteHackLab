const express = require('express');
const router = express.Router();

// CSRF Labs Landing
router.get('/', (req, res) => {
  res.render('labs/csrf/index', {
    title: 'CSRF Attack Labs',
    labs: [
      { id: 'basic', name: 'Basic CSRF', difficulty: 'Easy', path: '/labs/csrf/basic' },
      { id: 'token-bypass', name: 'CSRF Token Bypass', difficulty: 'Medium', path: '/labs/csrf/token-bypass' },
      { id: 'json-csrf', name: 'JSON CSRF', difficulty: 'Medium', path: '/labs/csrf/json-csrf' },
    ]
  });
});

// Lab 1: Basic CSRF - No token protection
router.get('/basic', (req, res) => {
  const db = req.app.locals.db;
  // Simulate logged-in user
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get();
  res.render('labs/csrf/basic', {
    title: 'Basic CSRF Attack',
    user,
    labId: 'csrf-basic',
    message: null
  });
});

// VULNERABLE: No CSRF token validation
router.post('/basic/change-email', (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;
  
  // No CSRF token check! 
  db.prepare('UPDATE users SET email = ? WHERE id = 1').run(email);
  
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get();
  res.render('labs/csrf/basic', {
    title: 'Basic CSRF Attack',
    user,
    labId: 'csrf-basic',
    message: `Email changed to: ${email}. FLAG{csrf_token_missing}`
  });
});

// VULNERABLE: Password change without CSRF token
router.post('/basic/change-password', (req, res) => {
  const db = req.app.locals.db;
  const { new_password } = req.body;
  
  db.prepare('UPDATE users SET password = ? WHERE id = 1').run(new_password);
  
  res.json({ 
    success: true, 
    message: 'Password changed successfully!',
    flag: 'FLAG{csrf_token_missing}'
  });
});

// Lab 2: CSRF with weak token
router.get('/token-bypass', (req, res) => {
  // Weak token: just the username base64 encoded
  const token = Buffer.from('admin').toString('base64');
  res.render('labs/csrf/token-bypass', {
    title: 'CSRF Token Bypass',
    token,
    labId: 'csrf-basic',
    message: null
  });
});

router.post('/token-bypass/action', (req, res) => {
  const { csrf_token, action } = req.body;
  
  // Weak validation - only checks if token is present, not if it's valid
  if (csrf_token) {
    res.json({ 
      success: true, 
      message: `Action "${action}" executed! The token validation is weak.`,
      flag: 'FLAG{csrf_token_missing}'
    });
  } else {
    res.json({ success: false, message: 'CSRF token missing' });
  }
});

// Lab 3: JSON-based CSRF
router.get('/json-csrf', (req, res) => {
  res.render('labs/csrf/json-csrf', {
    title: 'JSON CSRF',
    labId: 'csrf-basic'
  });
});

// Accepts JSON but no origin/referer check
router.post('/json-csrf/transfer', (req, res) => {
  const { to, amount } = req.body;
  res.json({
    success: true,
    message: `Transferred $${amount} to ${to}`,
    note: 'No origin check, no CSRF token for JSON requests',
    flag: 'FLAG{csrf_token_missing}'
  });
});

module.exports = router;
