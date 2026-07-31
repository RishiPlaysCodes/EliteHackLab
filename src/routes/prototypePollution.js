const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/prototype/index', {
    title: 'Prototype Pollution Labs',
    labs: [
      { id: 'basic', name: 'Basic Prototype Pollution', difficulty: 'Hard', path: '/labs/prototype-pollution/basic' },
      { id: 'rce', name: 'Prototype Pollution to RCE', difficulty: 'Hard', path: '/labs/prototype-pollution/rce' },
      { id: 'xss', name: 'Prototype Pollution to XSS', difficulty: 'Hard', path: '/labs/prototype-pollution/xss' },
    ]
  });
});

router.get('/basic', (req, res) => { res.render('labs/prototype/basic', { title: 'Basic Prototype Pollution', labId: 'prototype-pollution' }); });

router.post('/basic/merge', (req, res) => {
  const { source } = req.body;
  
  // VULNERABLE: Unsafe deep merge
  function merge(target, source) {
    for (let key in source) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  const config = { theme: 'dark', lang: 'en' };
  
  try {
    const parsed = typeof source === 'string' ? JSON.parse(source) : source;
    
    // Check for __proto__ pollution
    if (JSON.stringify(parsed).includes('__proto__') || JSON.stringify(parsed).includes('constructor') || JSON.stringify(parsed).includes('prototype')) {
      // Simulate successful pollution
      res.json({
        success: true,
        flag: 'FLAG{prototype_polluted}',
        message: 'Prototype pollution successful! Object.prototype modified.',
        polluted: parsed,
        effect: 'All objects now inherit the polluted properties'
      });
    } else {
      merge(config, parsed);
      res.json({ success: true, config, hint: 'Try: {"__proto__":{"isAdmin":true}} or {"constructor":{"prototype":{"isAdmin":true}}}' });
    }
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.get('/rce', (req, res) => { res.render('labs/prototype/rce', { title: 'Prototype Pollution → RCE', labId: 'prototype-pollution' }); });
router.get('/xss', (req, res) => { res.render('labs/prototype/xss', { title: 'Prototype Pollution → XSS', labId: 'prototype-pollution' }); });

module.exports = router;
