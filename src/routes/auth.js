const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Auth Labs Landing
router.get('/', (req, res) => {
  res.render('labs/auth/index', {
    title: 'Authentication Bypass Labs',
    labs: [
      { id: 'brute-force', name: 'Brute Force Attack', difficulty: 'Easy', path: '/labs/auth/brute-force' },
      { id: 'session-fixation', name: 'Session Fixation', difficulty: 'Medium', path: '/labs/auth/session-fixation' },
      { id: 'weak-reset', name: 'Weak Password Reset', difficulty: 'Medium', path: '/labs/auth/weak-reset' },
      { id: 'enum', name: 'Username Enumeration', difficulty: 'Easy', path: '/labs/auth/enum' },
    ]
  });
});

// Lab 1: Brute Force - No rate limiting
router.get('/brute-force', (req, res) => {
  res.render('labs/auth/brute-force', { title: 'Brute Force Attack', labId: 'brute-force', message: null, success: false });
});

router.post('/brute-force/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  // NO RATE LIMITING - vulnerable to brute force
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (user) {
    res.json({ success: true, message: `Login successful! Welcome ${user.username} (${user.role})`, flag: 'FLAG{brute_force_success}' });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Lab 2: Session Fixation
router.get('/session-fixation', (req, res) => {
  res.render('labs/auth/session-fixation', { 
    title: 'Session Fixation', 
    labId: 'session-fixation',
    sessionId: req.sessionID
  });
});

router.get('/session-fixation/login', (req, res) => {
  // VULNERABLE: Accepts session ID from URL parameter and doesn't regenerate
  const sid = req.query.sid;
  if (sid) {
    req.session.fixedSession = sid;
    req.session.loggedIn = true;
    req.session.user = 'admin';
  }
  res.json({ 
    success: true, 
    message: 'Logged in with fixed session!',
    sessionId: req.sessionID,
    fixedSid: sid,
    flag: sid ? 'FLAG{session_fixed}' : undefined,
    note: 'The session was not regenerated after login - session fixation!'
  });
});

// Lab 3: Weak Password Reset
router.get('/weak-reset', (req, res) => {
  res.render('labs/auth/weak-reset', { title: 'Weak Password Reset', labId: 'brute-force', message: null });
});

router.post('/weak-reset/request', (req, res) => {
  const { email } = req.body;
  // VULNERABLE: Predictable reset token (timestamp-based)
  const token = Date.now().toString(36);
  res.json({
    success: true,
    message: `Reset link sent to ${email}`,
    debug_token: token, // Information disclosure
    reset_url: `/labs/auth/weak-reset/verify?token=${token}&email=${email}`,
    hint: 'The token is just the timestamp in base36. Predictable!'
  });
});

router.get('/weak-reset/verify', (req, res) => {
  const { token, email } = req.query;
  if (token && email) {
    res.json({ success: true, message: `Password reset for ${email}!`, flag: 'FLAG{brute_force_success}' });
  } else {
    res.json({ success: false, message: 'Invalid token' });
  }
});

// Lab 4: Username Enumeration
router.get('/enum', (req, res) => {
  res.render('labs/auth/enum', { title: 'Username Enumeration', labId: 'brute-force' });
});

router.post('/enum/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  // VULNERABLE: Different error messages reveal if username exists
  if (!user) {
    return res.json({ success: false, message: 'User does not exist' }); // Reveals username doesn't exist
  }
  
  if (user.password !== password) {
    return res.json({ success: false, message: 'Incorrect password for this account' }); // Confirms user exists
  }
  
  res.json({ success: true, message: `Welcome back, ${user.username}!`, flag: 'FLAG{brute_force_success}' });
});

module.exports = router;
