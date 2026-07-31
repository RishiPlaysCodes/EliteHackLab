const express = require('express');
const router = express.Router();

// IDOR Labs Landing
router.get('/', (req, res) => {
  res.render('labs/idor/index', {
    title: 'IDOR / Access Control Labs',
    labs: [
      { id: 'basic', name: 'Basic IDOR', difficulty: 'Easy', path: '/labs/idor/basic' },
      { id: 'api', name: 'API IDOR', difficulty: 'Medium', path: '/labs/idor/api' },
      { id: 'horizontal', name: 'Horizontal Privilege Escalation', difficulty: 'Medium', path: '/labs/idor/horizontal' },
    ]
  });
});

// Lab 1: Basic IDOR - Message access
router.get('/basic', (req, res) => {
  res.render('labs/idor/basic', { title: 'Basic IDOR', labId: 'idor-basic' });
});

router.get('/basic/message/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = req.params.id;
  
  // VULNERABLE: No authorization check - any user can access any message by ID
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  
  if (message) {
    res.json({ success: true, message });
  } else {
    res.json({ success: false, error: 'Message not found' });
  }
});

// Lab 2: API IDOR - User profile
router.get('/api', (req, res) => {
  res.render('labs/idor/api', { title: 'API IDOR', labId: 'idor-basic' });
});

router.get('/api/user/:id', (req, res) => {
  const db = req.app.locals.db;
  
  // VULNERABLE: No auth check, returns sensitive data
  const user = db.prepare('SELECT id, username, email, role, api_key FROM users WHERE id = ?').get(req.params.id);
  
  if (user) {
    const flag = (user.role === 'admin' || user.role === 'superadmin') ? 'FLAG{idor_champion}' : undefined;
    res.json({ success: true, user, flag });
  } else {
    res.json({ success: false, error: 'User not found' });
  }
});

// Lab 3: Horizontal Privilege Escalation
router.get('/horizontal', (req, res) => {
  res.render('labs/idor/horizontal', { title: 'Horizontal Privilege Escalation', labId: 'idor-basic' });
});

router.get('/horizontal/secrets/:id', (req, res) => {
  const db = req.app.locals.db;
  
  // VULNERABLE: No ownership check
  const secret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(req.params.id);
  
  if (secret) {
    res.json({ success: true, secret, flag: secret.classification === 'top-secret' ? 'FLAG{idor_champion}' : undefined });
  } else {
    res.json({ success: false, error: 'Secret not found' });
  }
});

module.exports = router;
