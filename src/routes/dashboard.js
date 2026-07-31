const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  
  const categories = [
    {
      id: 'web-exploitation',
      name: 'Web Exploitation',
      icon: '🌐',
      color: '#ff4444',
      description: 'SQL Injection, XSS, CSRF, SSRF, Command Injection, File Upload, Path Traversal',
      labs: [
        { id: 'sqli', name: 'SQL Injection', path: '/labs/sqli', difficulty: 'Easy-Hard', count: 5 },
        { id: 'xss', name: 'Cross-Site Scripting (XSS)', path: '/labs/xss', difficulty: 'Easy-Hard', count: 4 },
        { id: 'csrf', name: 'CSRF Attacks', path: '/labs/csrf', difficulty: 'Easy-Medium', count: 3 },
        { id: 'ssrf', name: 'Server-Side Request Forgery', path: '/labs/ssrf', difficulty: 'Medium-Hard', count: 3 },
        { id: 'cmd', name: 'Command Injection', path: '/labs/cmd-injection', difficulty: 'Medium', count: 3 },
        { id: 'upload', name: 'File Upload Attacks', path: '/labs/file-upload', difficulty: 'Easy-Medium', count: 3 },
        { id: 'traversal', name: 'Path Traversal / LFI', path: '/labs/path-traversal', difficulty: 'Medium', count: 3 },
      ]
    },
    {
      id: 'auth-session',
      name: 'Authentication & Sessions',
      icon: '🔐',
      color: '#ff8800',
      description: 'Brute Force, Session Hijacking, JWT Attacks, OAuth Flaws, Password Attacks',
      labs: [
        { id: 'auth', name: 'Authentication Bypass', path: '/labs/auth', difficulty: 'Easy-Hard', count: 4 },
        { id: 'jwt', name: 'JWT Token Attacks', path: '/labs/jwt', difficulty: 'Medium-Hard', count: 4 },
        { id: 'idor', name: 'IDOR / Access Control', path: '/labs/idor', difficulty: 'Easy-Medium', count: 3 },
      ]
    },
    {
      id: 'network-security',
      name: 'Network Security',
      icon: '🔌',
      color: '#ffcc00',
      description: 'Port Scanning, MITM Concepts, DNS Attacks, Packet Analysis, Network Protocols',
      labs: [
        { id: 'network', name: 'Network Attack Simulations', path: '/labs/network', difficulty: 'Medium-Hard', count: 5 },
      ]
    },
    {
      id: 'cloud-security',
      name: 'Cloud Security',
      icon: '☁️',
      color: '#00ccff',
      description: 'S3 Misconfiguration, IAM Issues, Metadata Attacks, Container Escape, Serverless',
      labs: [
        { id: 'cloud', name: 'Cloud Vulnerability Labs', path: '/labs/cloud', difficulty: 'Medium-Hard', count: 5 },
      ]
    },
    {
      id: 'cryptography',
      name: 'Cryptography',
      icon: '🔑',
      color: '#cc00ff',
      description: 'Weak Ciphers, Hash Cracking, Padding Oracle, Key Reuse, ECB Mode Attacks',
      labs: [
        { id: 'crypto', name: 'Cryptography Labs', path: '/labs/crypto', difficulty: 'Easy-Hard', count: 5 },
      ]
    },
    {
      id: 'social-engineering',
      name: 'Social Engineering',
      icon: '🎭',
      color: '#ff00aa',
      description: 'Phishing Detection, Pretexting, Vishing, Baiting, Awareness Training',
      labs: [
        { id: 'social', name: 'Social Engineering Labs', path: '/labs/social', difficulty: 'Easy-Medium', count: 4 },
      ]
    },
    {
      id: 'mobile-security',
      name: 'Mobile Security',
      icon: '📱',
      color: '#00ff88',
      description: 'Insecure Storage, API Issues, Certificate Pinning, Mobile App Analysis',
      labs: [
        { id: 'mobile', name: 'Mobile Security Labs', path: '/labs/mobile', difficulty: 'Medium-Hard', count: 4 },
      ]
    },
    {
      id: 'forensics',
      name: 'Forensics & Reverse Engineering',
      icon: '🔍',
      color: '#0088ff',
      description: 'Steganography, Memory Analysis, Binary Analysis, Log Investigation, OSINT',
      labs: [
        { id: 'forensics', name: 'Digital Forensics Labs', path: '/labs/forensics', difficulty: 'Medium-Hard', count: 5 },
      ]
    },
    {
      id: 'privilege-escalation',
      name: 'Privilege Escalation',
      icon: '⬆️',
      color: '#ff4400',
      description: 'Linux PrivEsc, SUID Exploits, Cron Jobs, Kernel Exploits, Sudo Abuse',
      labs: [
        { id: 'privesc', name: 'Privilege Escalation Labs', path: '/labs/privesc', difficulty: 'Medium-Hard', count: 5 },
      ]
    },
    {
      id: 'api-security',
      name: 'API Security',
      icon: '🔗',
      color: '#88ff00',
      description: 'Mass Assignment, Rate Limiting, GraphQL Injection, NoSQL Injection, API Key Exposure',
      labs: [
        { id: 'api', name: 'API Vulnerability Labs', path: '/labs/api', difficulty: 'Medium-Hard', count: 5 },
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced Attacks',
      icon: '💀',
      color: '#ff0000',
      description: 'Race Conditions, Deserialization, SSTI, Prototype Pollution, HTTP Smuggling, WebSockets',
      labs: [
        { id: 'deserialization', name: 'Insecure Deserialization', path: '/labs/deserialization', difficulty: 'Hard', count: 3 },
        { id: 'ssti', name: 'Server-Side Template Injection', path: '/labs/ssti', difficulty: 'Hard', count: 3 },
        { id: 'prototype', name: 'Prototype Pollution', path: '/labs/prototype-pollution', difficulty: 'Hard', count: 3 },
        { id: 'race', name: 'Race Conditions', path: '/labs/race-condition', difficulty: 'Hard', count: 3 },
        { id: 'websocket', name: 'WebSocket Attacks', path: '/labs/websocket', difficulty: 'Hard', count: 3 },
        { id: 'advanced', name: 'HTTP Smuggling & More', path: '/labs/advanced', difficulty: 'Elite', count: 4 },
      ]
    },
  ];

  // Get stats
  let totalFlags = 0;
  let totalCompleted = 0;
  try {
    totalFlags = db.prepare('SELECT COUNT(*) as count FROM flags').get().count;
    totalCompleted = db.prepare('SELECT COUNT(*) as count FROM progress WHERE completed = 1').get().count;
  } catch(e) {}

  res.render('dashboard', { 
    categories, 
    totalFlags, 
    totalCompleted,
    totalLabs: 40
  });
});

// Scoreboard
router.get('/scoreboard', (req, res) => {
  const db = req.app.locals.db;
  let scores = [];
  try {
    scores = db.prepare(`
      SELECT u.username, COUNT(p.id) as labs_completed, 
             COALESCE(SUM(f.points), 0) as total_points
      FROM progress p
      JOIN users u ON p.user_id = u.id
      JOIN flags f ON p.lab_id = f.lab_id
      WHERE p.completed = 1
      GROUP BY u.id
      ORDER BY total_points DESC
    `).all();
  } catch(e) {}
  
  res.render('scoreboard', { scores });
});

module.exports = router;
