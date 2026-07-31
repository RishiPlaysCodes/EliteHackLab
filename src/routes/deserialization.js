const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/deserialization/index', {
    title: 'Insecure Deserialization Labs',
    labs: [
      { id: 'basic', name: 'Node.js Deserialization', difficulty: 'Hard', path: '/labs/deserialization/basic' },
      { id: 'cookie', name: 'Cookie Deserialization', difficulty: 'Hard', path: '/labs/deserialization/cookie' },
      { id: 'yaml', name: 'YAML Deserialization', difficulty: 'Medium', path: '/labs/deserialization/yaml' },
    ]
  });
});

router.get('/basic', (req, res) => { res.render('labs/deserialization/basic', { title: 'Node.js Deserialization', labId: 'deserialization' }); });

router.post('/basic/process', (req, res) => {
  const { serialized } = req.body;
  
  // Detect deserialization attack patterns
  if (serialized && (serialized.includes('_$$ND_FUNC$$_') || serialized.includes('function') || 
      serialized.includes('exec') || serialized.includes('require') || serialized.includes('child_process'))) {
    res.json({
      success: true,
      flag: 'FLAG{insecure_deserialize}',
      message: 'RCE via insecure deserialization! The serialized object contained executable code.',
      payload: serialized
    });
  } else {
    try {
      const obj = JSON.parse(serialized);
      res.json({ success: true, deserialized: obj, hint: 'Try node-serialize RCE payload: {"exploit":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'id\')}()"}' });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  }
});

router.get('/cookie', (req, res) => {
  // Set a serialized cookie
  const cookieData = Buffer.from(JSON.stringify({ user: 'guest', role: 'user', isAdmin: false })).toString('base64');
  res.cookie('session_data', cookieData);
  res.render('labs/deserialization/cookie', { title: 'Cookie Deserialization', labId: 'deserialization', cookieData });
});

router.post('/cookie/verify', (req, res) => {
  const { cookie } = req.body;
  try {
    const decoded = JSON.parse(Buffer.from(cookie, 'base64').toString());
    if (decoded.isAdmin === true || decoded.role === 'admin') {
      res.json({ success: true, flag: 'FLAG{insecure_deserialize}', user: decoded });
    } else {
      res.json({ success: true, user: decoded, hint: 'Decode base64 cookie, change isAdmin to true, re-encode and submit' });
    }
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.get('/yaml', (req, res) => { res.render('labs/deserialization/yaml', { title: 'YAML Deserialization', labId: 'deserialization' }); });

router.post('/yaml/parse', (req, res) => {
  const { yaml } = req.body;
  if (yaml && (yaml.includes('!!python') || yaml.includes('!!js') || yaml.includes('subprocess') || yaml.includes('exec'))) {
    res.json({ success: true, flag: 'FLAG{insecure_deserialize}', message: 'YAML deserialization RCE! Dangerous tags like !!python/object can execute code.' });
  } else {
    res.json({ success: true, parsed: yaml, hint: 'Try: !!python/object/apply:os.system ["id"] or !!js/function "function(){...}"' });
  }
});

module.exports = router;
