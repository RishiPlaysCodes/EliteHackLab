const express = require('express');
const router = express.Router();
const { parseString } = require('xml2js');

router.get('/', (req, res) => {
  res.render('labs/xxe/index', {
    title: 'XXE Labs',
    labs: [
      { id: 'basic', name: 'Basic XXE', difficulty: 'Hard', path: '/labs/xxe/basic' },
      { id: 'blind', name: 'Blind XXE', difficulty: 'Hard', path: '/labs/xxe/blind' },
      { id: 'ssrf-xxe', name: 'XXE to SSRF', difficulty: 'Hard', path: '/labs/xxe/ssrf' },
    ]
  });
});

router.get('/basic', (req, res) => { res.render('labs/xxe/basic', { title: 'Basic XXE', labId: 'xxe-basic' }); });

router.post('/basic/parse', (req, res) => {
  const xml = req.body;
  
  if (typeof xml !== 'string') {
    return res.json({ error: 'Send XML as text/plain or application/xml' });
  }
  
  // Check for XXE patterns
  if (xml.includes('<!ENTITY') || xml.includes('SYSTEM') || xml.includes('file://') || xml.includes('expect://')) {
    // Simulate XXE exploitation
    const fakeFiles = {
      '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nFLAG{xxe_file_disclosure}',
      '/etc/shadow': 'root:$6$hash:18000:0:99999:7:::',
      '/app/config.js': 'module.exports = { secret: "FLAG{xxe_file_disclosure}" }',
    };
    
    let extracted = 'XXE Injection Detected!\n';
    for (const [path, content] of Object.entries(fakeFiles)) {
      if (xml.includes(path)) {
        extracted += `\nFile: ${path}\n${content}\n`;
      }
    }
    if (extracted === 'XXE Injection Detected!\n') {
      extracted += '\nEntity definition found! Try reading: file:///etc/passwd';
    }
    
    return res.json({ success: true, result: extracted, flag: 'FLAG{xxe_file_disclosure}' });
  }
  
  // Normal XML parsing
  parseString(xml, (err, result) => {
    if (err) return res.json({ error: err.message });
    res.json({ success: true, parsed: result });
  });
});

router.get('/blind', (req, res) => { res.render('labs/xxe/blind', { title: 'Blind XXE', labId: 'xxe-basic' }); });
router.get('/ssrf', (req, res) => { res.render('labs/xxe/ssrf', { title: 'XXE to SSRF', labId: 'xxe-basic' }); });

module.exports = router;
