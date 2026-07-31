const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/ssti/index', {
    title: 'SSTI Labs',
    labs: [
      { id: 'basic', name: 'Basic SSTI', difficulty: 'Hard', path: '/labs/ssti/basic' },
      { id: 'sandbox-escape', name: 'Sandbox Escape', difficulty: 'Hard', path: '/labs/ssti/sandbox-escape' },
      { id: 'blind', name: 'Blind SSTI', difficulty: 'Hard', path: '/labs/ssti/blind' },
    ]
  });
});

router.get('/basic', (req, res) => { res.render('labs/ssti/basic', { title: 'Basic SSTI', labId: 'ssti-basic' }); });

router.post('/basic/render', (req, res) => {
  const { template } = req.body;
  
  // Simulated template injection detection
  const mathPatterns = [/\{\{.*7\*7.*\}\}/, /\$\{.*7\*7.*\}/, /\{\{.*49.*\}\}/, /#\{.*7\*7.*\}/];
  const execPatterns = [/process/, /require/, /child_process/, /exec/, /spawn/, /constructor/,
    /\.__class__/, /\.__mro__/, /\.__subclasses__/, /os\.popen/, /subprocess/];
  
  let result = '';
  let flag = undefined;
  
  // Check for math expression (detection)
  if (mathPatterns.some(p => p.test(template))) {
    result = 'Template expression evaluated: 49\nSSTI Confirmed!';
  }
  
  // Check for code execution patterns
  if (execPatterns.some(p => p.test(template))) {
    result = `Code execution detected!\nTemplate: ${template}\nResult: uid=0(root) gid=0(root)\nFLAG{ssti_template_rce}`;
    flag = 'FLAG{ssti_template_rce}';
  }
  
  if (!result) {
    result = `Output: ${template}\nHint: Try {{7*7}} or {{config}} or {{''.__class__.__mro__}}`;
  }
  
  res.json({ success: true, result, flag });
});

router.get('/sandbox-escape', (req, res) => { res.render('labs/ssti/sandbox-escape', { title: 'Sandbox Escape', labId: 'ssti-basic' }); });
router.get('/blind', (req, res) => { res.render('labs/ssti/blind', { title: 'Blind SSTI', labId: 'ssti-basic' }); });

module.exports = router;
