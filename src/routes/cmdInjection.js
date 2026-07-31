const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

// Command Injection Labs Landing
router.get('/', (req, res) => {
  res.render('labs/cmd/index', {
    title: 'Command Injection Labs',
    labs: [
      { id: 'basic', name: 'Basic Command Injection', difficulty: 'Medium', path: '/labs/cmd-injection/basic' },
      { id: 'blind', name: 'Blind Command Injection', difficulty: 'Hard', path: '/labs/cmd-injection/blind' },
      { id: 'filter-bypass', name: 'Filter Bypass', difficulty: 'Hard', path: '/labs/cmd-injection/filter-bypass' },
    ]
  });
});

// Lab 1: Basic Command Injection - ping utility
router.get('/basic', (req, res) => {
  res.render('labs/cmd/basic', {
    title: 'Basic Command Injection',
    labId: 'cmd-injection',
    output: null,
    host: ''
  });
});

router.post('/basic/ping', (req, res) => {
  const { host } = req.body;
  let output = '';

  // INTENTIONALLY VULNERABLE - Direct command execution
  try {
    // Simulated output (safer for lab environment but demonstrates the concept)
    if (host.includes(';') || host.includes('|') || host.includes('&&') || host.includes('`') || host.includes('$(')) {
      // Detect injection and show what would happen
      output = `PING localhost (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.1ms\n\n--- Command Injection Detected! ---\nInjected command would execute: ${host}\n\nFLAG{command_injection_rce}\n\nIn a real vulnerable system, your injected command would run on the server.`;
    } else {
      output = `PING ${host} (${host}): 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=64 time=12.3ms\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=11.8ms\n\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`;
    }
  } catch (e) {
    output = `Error: ${e.message}`;
  }

  res.render('labs/cmd/basic', {
    title: 'Basic Command Injection',
    labId: 'cmd-injection',
    output,
    host
  });
});

// Lab 2: Blind Command Injection
router.get('/blind', (req, res) => {
  res.render('labs/cmd/blind', {
    title: 'Blind Command Injection',
    labId: 'cmd-injection',
    message: null
  });
});

router.post('/blind/submit', (req, res) => {
  const { email } = req.body;
  const start = Date.now();
  
  // INTENTIONALLY VULNERABLE - Blind injection (no output shown)
  // Detect if injection payload is present
  let delay = 0;
  if (email.includes(';sleep') || email.includes('|sleep') || email.includes('&&sleep') || 
      email.includes('; sleep') || email.includes('| sleep') || email.includes('&& sleep')) {
    // Simulate the sleep delay
    const match = email.match(/sleep\s*(\d+)/);
    delay = match ? parseInt(match[1]) * 1000 : 2000;
  }

  setTimeout(() => {
    const elapsed = Date.now() - start;
    res.json({
      success: true,
      message: 'Email notification queued.',
      time_ms: elapsed,
      hint: elapsed > 1500 ? 'Notice the delay? FLAG{command_injection_rce}' : 'Try time-based injection'
    });
  }, Math.min(delay, 5000)); // Cap at 5 seconds
});

// Lab 3: Filter Bypass
router.get('/filter-bypass', (req, res) => {
  res.render('labs/cmd/filter-bypass', {
    title: 'Command Injection - Filter Bypass',
    labId: 'cmd-injection',
    output: null,
    input: ''
  });
});

router.post('/filter-bypass/exec', (req, res) => {
  let { input } = req.body;
  
  // Weak filter - blocks common patterns but can be bypassed
  const blacklist = [';', '|', '&', '`', '$', '(', ')', '{', '}'];
  let blocked = false;
  
  for (const char of blacklist) {
    if (input.includes(char)) {
      blocked = true;
      break;
    }
  }

  let output = '';
  if (blocked) {
    output = 'Blocked: Dangerous characters detected!';
  } else {
    // But doesn't block newline injection (%0a), tab separation, etc.
    if (input.includes('\n') || input.includes('%0a') || input.includes('\\n')) {
      output = `Filter bypassed with newline/encoding!\nFLAG{command_injection_rce}\n\nInjected: ${input}`;
    } else {
      output = `DNS lookup for: ${input}\nResult: 93.184.216.34`;
    }
  }

  res.json({ output, blocked, input });
});

module.exports = router;
