const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/websocket/index', {
    title: 'WebSocket Attack Labs',
    labs: [
      { id: 'hijack', name: 'WebSocket Hijacking', difficulty: 'Hard', path: '/labs/websocket/hijack' },
      { id: 'xss', name: 'XSS via WebSocket', difficulty: 'Hard', path: '/labs/websocket/xss' },
      { id: 'auth', name: 'No Auth on WebSocket', difficulty: 'Medium', path: '/labs/websocket/auth' },
    ]
  });
});

router.get('/hijack', (req, res) => { res.render('labs/websocket/hijack', { title: 'WebSocket Hijacking', labId: 'websocket-attack' }); });
router.get('/xss', (req, res) => { res.render('labs/websocket/xss', { title: 'XSS via WebSocket', labId: 'websocket-attack' }); });
router.get('/auth', (req, res) => { res.render('labs/websocket/auth', { title: 'No Auth WebSocket', labId: 'websocket-attack' }); });

module.exports = router;
