const express = require('express');
const router = express.Router();

// XSS Labs Landing
router.get('/', (req, res) => {
  res.render('labs/xss/index', {
    title: 'Cross-Site Scripting (XSS) Labs',
    labs: [
      { id: 'reflected', name: 'Reflected XSS', difficulty: 'Easy', path: '/labs/xss/reflected' },
      { id: 'stored', name: 'Stored XSS', difficulty: 'Medium', path: '/labs/xss/stored' },
      { id: 'dom', name: 'DOM-Based XSS', difficulty: 'Hard', path: '/labs/xss/dom' },
      { id: 'filter-bypass', name: 'XSS Filter Bypass', difficulty: 'Hard', path: '/labs/xss/filter-bypass' },
    ]
  });
});

// Lab 1: Reflected XSS
router.get('/reflected', (req, res) => {
  const search = req.query.q || '';
  // INTENTIONALLY VULNERABLE - No sanitization, reflected directly
  res.render('labs/xss/reflected', {
    title: 'Reflected XSS',
    search,
    labId: 'xss-reflected'
  });
});

// Lab 2: Stored XSS (comment system)
router.get('/stored', (req, res) => {
  const db = req.app.locals.db;
  const comments = db.prepare("SELECT * FROM comments WHERE page = 'xss-lab' ORDER BY created_at DESC").all();
  
  res.render('labs/xss/stored', {
    title: 'Stored XSS',
    comments,
    labId: 'xss-stored'
  });
});

router.post('/stored/comment', (req, res) => {
  const db = req.app.locals.db;
  const { content, username } = req.body;

  // INTENTIONALLY VULNERABLE - Stores without sanitization
  db.prepare("INSERT INTO comments (user_id, content, page) VALUES (1, ?, 'xss-lab')").run(content);
  res.redirect('/labs/xss/stored');
});

// Clear stored XSS comments (reset)
router.post('/stored/reset', (req, res) => {
  const db = req.app.locals.db;
  db.prepare("DELETE FROM comments WHERE page = 'xss-lab'").run();
  res.redirect('/labs/xss/stored');
});

// Lab 3: DOM-Based XSS
router.get('/dom', (req, res) => {
  res.render('labs/xss/dom', {
    title: 'DOM-Based XSS',
    labId: 'xss-dom'
  });
});

// Lab 4: XSS Filter Bypass
router.get('/filter-bypass', (req, res) => {
  let input = req.query.input || '';
  
  // Weak filter - can be bypassed
  let filtered = input
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');

  res.render('labs/xss/filter-bypass', {
    title: 'XSS Filter Bypass',
    input,
    filtered,
    labId: 'xss-reflected'
  });
});

// API endpoint that returns JSON with XSS potential
router.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  // Returns with wrong content-type (vulnerable)
  res.setHeader('Content-Type', 'text/html');
  res.send(`{"query": "${q}", "results": []}`);
});

module.exports = router;
