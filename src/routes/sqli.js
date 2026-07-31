const express = require('express');
const router = express.Router();

// SQL Injection Labs Landing Page
router.get('/', (req, res) => {
  res.render('labs/sqli/index', {
    title: 'SQL Injection Labs',
    labs: [
      { id: 'basic', name: 'Basic SQL Injection', difficulty: 'Easy', path: '/labs/sqli/basic' },
      { id: 'union', name: 'UNION-Based Injection', difficulty: 'Medium', path: '/labs/sqli/union' },
      { id: 'blind', name: 'Blind SQL Injection', difficulty: 'Hard', path: '/labs/sqli/blind' },
      { id: 'login-bypass', name: 'Login Bypass', difficulty: 'Easy', path: '/labs/sqli/login-bypass' },
      { id: 'second-order', name: 'Second-Order Injection', difficulty: 'Hard', path: '/labs/sqli/second-order' },
    ]
  });
});

// Lab 1: Basic SQL Injection (search products)
router.get('/basic', (req, res) => {
  const db = req.app.locals.db;
  const search = req.query.search || '';
  let results = [];
  let error = null;
  let query = '';

  if (search) {
    // INTENTIONALLY VULNERABLE - Direct string concatenation
    query = `SELECT * FROM products WHERE name LIKE '%${search}%' AND hidden = 0`;
    try {
      results = db.prepare(query).all();
    } catch (e) {
      error = e.message; // Information disclosure
    }
  }

  res.render('labs/sqli/basic', {
    title: 'Basic SQL Injection',
    search,
    results,
    error,
    query,
    labId: 'sqli-basic'
  });
});

// Lab 2: UNION-Based SQL Injection
router.get('/union', (req, res) => {
  const db = req.app.locals.db;
  const category = req.query.category || '';
  let results = [];
  let error = null;
  let query = '';

  if (category) {
    // INTENTIONALLY VULNERABLE - UNION injection possible
    query = `SELECT id, name, price, category FROM products WHERE category = '${category}' AND hidden = 0`;
    try {
      results = db.prepare(query).all();
    } catch (e) {
      error = e.message;
    }
  }

  res.render('labs/sqli/union', {
    title: 'UNION-Based SQL Injection',
    category,
    results,
    error,
    query,
    labId: 'sqli-union'
  });
});

// Lab 3: Blind SQL Injection
router.get('/blind', (req, res) => {
  res.render('labs/sqli/blind', {
    title: 'Blind SQL Injection',
    labId: 'sqli-blind'
  });
});

router.get('/blind/check', (req, res) => {
  const db = req.app.locals.db;
  const id = req.query.id || '1';

  // INTENTIONALLY VULNERABLE - Boolean-based blind SQLi
  const query = `SELECT * FROM products WHERE id = ${id}`;
  try {
    const result = db.prepare(query).get();
    if (result) {
      res.json({ exists: true, message: 'Product exists' });
    } else {
      res.json({ exists: false, message: 'Product not found' });
    }
  } catch (e) {
    res.json({ exists: false, message: 'Error', error: e.message });
  }
});

// Time-based blind injection endpoint
router.get('/blind/time', (req, res) => {
  const db = req.app.locals.db;
  const id = req.query.id || '1';

  // Simulated time-based (SQLite doesn't support SLEEP, but we simulate)
  const start = Date.now();
  const query = `SELECT * FROM products WHERE id = ${id}`;
  try {
    const result = db.prepare(query).get();
    // Simulate delay if condition is true
    if (id.includes('CASE') || id.includes('case')) {
      // Simulate time-based by actually waiting
      const delay = result ? 2000 : 0;
      setTimeout(() => {
        res.json({ time: Date.now() - start, exists: !!result });
      }, delay);
    } else {
      res.json({ time: Date.now() - start, exists: !!result });
    }
  } catch (e) {
    res.json({ time: Date.now() - start, exists: false, error: e.message });
  }
});

// Lab 4: Login Bypass
router.get('/login-bypass', (req, res) => {
  res.render('labs/sqli/login-bypass', {
    title: 'SQL Injection - Login Bypass',
    labId: 'sqli-basic',
    message: null,
    success: false
  });
});

router.post('/login-bypass', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  // INTENTIONALLY VULNERABLE - Direct concatenation in login
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  let message = null;
  let success = false;

  try {
    const user = db.prepare(query).get();
    if (user) {
      success = true;
      message = `Welcome ${user.username}! Role: ${user.role}. ${user.role === 'admin' ? 'FLAG{sql_injection_101}' : 'Try to login as admin!'}`;
    } else {
      message = 'Invalid credentials!';
    }
  } catch (e) {
    message = `SQL Error: ${e.message}`;
  }

  res.render('labs/sqli/login-bypass', {
    title: 'SQL Injection - Login Bypass',
    labId: 'sqli-basic',
    message,
    success
  });
});

// Lab 5: Second-Order SQL Injection
router.get('/second-order', (req, res) => {
  res.render('labs/sqli/second-order', {
    title: 'Second-Order SQL Injection',
    labId: 'sqli-blind',
    message: null
  });
});

router.post('/second-order/register', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  // Stores the malicious input (escaped for INSERT but used raw later)
  try {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, 'user');
    res.json({ success: true, message: `User "${username}" registered! Now try to view your profile.` });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.get('/second-order/profile', (req, res) => {
  const db = req.app.locals.db;
  const username = req.query.username;

  // INTENTIONALLY VULNERABLE - Fetches stored username and uses it in another query
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (user) {
    // Second-order: uses the stored username in a new vulnerable query
    const query = `SELECT * FROM messages WHERE sender_id = (SELECT id FROM users WHERE username = '${user.username}')`;
    try {
      const messages = db.prepare(query).all();
      res.json({ user: { username: user.username, role: user.role }, messages, query });
    } catch (e) {
      res.json({ error: e.message, query });
    }
  } else {
    res.json({ error: 'User not found' });
  }
});

module.exports = router;
