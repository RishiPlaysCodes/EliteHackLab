const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const WEAK_SECRET = 'secret'; // Intentionally weak

// JWT Labs Landing
router.get('/', (req, res) => {
  res.render('labs/jwt/index', {
    title: 'JWT Attack Labs',
    labs: [
      { id: 'none-alg', name: 'Algorithm None Attack', difficulty: 'Medium', path: '/labs/jwt/none-alg' },
      { id: 'weak-secret', name: 'Weak Secret Brute Force', difficulty: 'Medium', path: '/labs/jwt/weak-secret' },
      { id: 'role-tampering', name: 'JWT Role Tampering', difficulty: 'Easy', path: '/labs/jwt/role-tampering' },
      { id: 'kid-injection', name: 'KID Header Injection', difficulty: 'Hard', path: '/labs/jwt/kid-injection' },
    ]
  });
});

// Lab 1: Algorithm None
router.get('/none-alg', (req, res) => {
  const token = jwt.sign({ user: 'guest', role: 'user' }, WEAK_SECRET, { algorithm: 'HS256' });
  res.render('labs/jwt/none-alg', { title: 'JWT Algorithm None', labId: 'jwt-none', token });
});

router.post('/none-alg/verify', (req, res) => {
  const { token } = req.body;
  
  try {
    // VULNERABLE: Accepts 'none' algorithm
    const parts = token.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    if (header.alg === 'none' || header.alg === 'None' || header.alg === 'NONE') {
      // Algorithm none accepted!
      if (payload.role === 'admin') {
        return res.json({ success: true, payload, flag: 'FLAG{jwt_algorithm_none}', message: 'Admin access granted via alg:none!' });
      }
      return res.json({ success: true, payload, message: 'Token accepted with none algorithm. Now change role to admin!' });
    }
    
    // Normal verification
    const decoded = jwt.verify(token, WEAK_SECRET);
    if (decoded.role === 'admin') {
      res.json({ success: true, payload: decoded, flag: 'FLAG{jwt_algorithm_none}' });
    } else {
      res.json({ success: true, payload: decoded, message: 'Valid token but not admin. Change your role!' });
    }
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// Lab 2: Weak Secret
router.get('/weak-secret', (req, res) => {
  const token = jwt.sign({ user: 'hacker', role: 'user', iat: Math.floor(Date.now()/1000) }, WEAK_SECRET);
  res.render('labs/jwt/weak-secret', { title: 'JWT Weak Secret', labId: 'jwt-weak-secret', token });
});

router.post('/weak-secret/verify', (req, res) => {
  const { token } = req.body;
  
  try {
    const decoded = jwt.verify(token, WEAK_SECRET);
    if (decoded.role === 'admin') {
      res.json({ success: true, payload: decoded, flag: 'FLAG{jwt_weak_secret_cracked}', message: 'You cracked the secret and forged an admin token!' });
    } else {
      res.json({ success: true, payload: decoded, message: 'Valid token. Crack the secret, forge a token with role:admin' });
    }
  } catch (e) {
    res.json({ success: false, error: e.message, hint: 'The secret is a common word. Try: secret, password, key, admin...' });
  }
});

// Lab 3: Role Tampering
router.get('/role-tampering', (req, res) => {
  const token = jwt.sign({ user: 'regular_user', role: 'user', id: 42 }, WEAK_SECRET);
  res.render('labs/jwt/role-tampering', { title: 'JWT Role Tampering', labId: 'jwt-none', token });
});

router.get('/role-tampering/admin', (req, res) => {
  const authHeader = req.headers.authorization || req.query.token || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) return res.json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, WEAK_SECRET);
    if (decoded.role === 'admin') {
      res.json({ success: true, message: 'Admin panel accessed!', flag: 'FLAG{jwt_algorithm_none}', data: { users: 5, secrets: 3 } });
    } else {
      res.json({ success: false, message: `Access denied. Your role: ${decoded.role}. Required: admin` });
    }
  } catch (e) {
    // Also try without verification (accepting none algorithm)
    try {
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (payload.role === 'admin') {
        res.json({ success: true, message: 'Admin access via unsigned token!', flag: 'FLAG{jwt_algorithm_none}' });
      } else {
        res.json({ success: false, error: e.message });
      }
    } catch(e2) {
      res.json({ success: false, error: e.message });
    }
  }
});

// Lab 4: KID Header Injection
router.get('/kid-injection', (req, res) => {
  const token = jwt.sign({ user: 'user', role: 'user' }, WEAK_SECRET, { 
    header: { kid: 'key-file-1', alg: 'HS256' }
  });
  res.render('labs/jwt/kid-injection', { title: 'KID Header Injection', labId: 'jwt-weak-secret', token });
});

router.post('/kid-injection/verify', (req, res) => {
  const { token } = req.body;
  
  try {
    const parts = token.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // VULNERABLE: KID used in file path (path traversal) or SQL injection
    const kid = header.kid || 'default';
    
    // Simulated: if KID contains injection patterns
    if (kid.includes('../') || kid.includes('/dev/null') || kid === '' || kid.includes('sql')) {
      // KID injection successful - verify with empty/known key
      if (payload.role === 'admin') {
        return res.json({ success: true, flag: 'FLAG{jwt_weak_secret_cracked}', message: 'KID injection → forged admin token!', kid });
      }
      return res.json({ success: true, message: 'KID injection works! Now forge an admin token.', kid });
    }
    
    // Normal verify
    const decoded = jwt.verify(token, WEAK_SECRET);
    res.json({ success: true, payload: decoded, message: 'Valid token. Try manipulating the KID header.' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

module.exports = router;
