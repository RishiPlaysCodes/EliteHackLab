const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/social/index', {
    title: 'Social Engineering Labs',
    labs: [
      { id: 'phishing', name: 'Phishing Detection', difficulty: 'Easy', path: '/labs/social/phishing' },
      { id: 'pretexting', name: 'Pretexting Scenarios', difficulty: 'Medium', path: '/labs/social/pretexting' },
      { id: 'email-headers', name: 'Email Header Analysis', difficulty: 'Medium', path: '/labs/social/email-headers' },
      { id: 'osint', name: 'OSINT Challenge', difficulty: 'Medium', path: '/labs/social/osint' },
    ]
  });
});

// Lab 1: Phishing Detection
router.get('/phishing', (req, res) => {
  const emails = [
    {
      id: 1, from: 'security@g00gle.com', subject: 'Urgent: Your account has been compromised!',
      body: 'Dear User, We detected suspicious activity. Click here to verify: http://g00gle-security.evil.com/verify',
      isPhishing: true, indicators: ['Domain misspelling (g00gle)', 'Urgency tactics', 'Suspicious URL', 'Generic greeting']
    },
    {
      id: 2, from: 'noreply@github.com', subject: 'New sign-in from Chrome on Windows',
      body: 'A new sign-in was detected from Chrome on Windows. If this was you, no action needed.',
      isPhishing: false, indicators: ['Legitimate domain', 'No urgent action required', 'No suspicious links']
    },
    {
      id: 3, from: 'support@paypa1.com', subject: 'Your payment of $499.99 was processed',
      body: 'Payment to CryptoExchange LLC. If unauthorized, click: http://paypa1-dispute.tk/claim',
      isPhishing: true, indicators: ['Domain: paypa1 (L→1)', '.tk domain', 'Fear of charge', 'Action required']
    },
    {
      id: 4, from: 'admin@company.internal', subject: 'IT Department: Password Reset Required',
      body: 'Per company policy, reset your password at: http://192.168.1.100/reset?token=abc123',
      isPhishing: true, indicators: ['Internal IP for password reset', 'Unusual request method', 'No HTTPS']
    },
    {
      id: 5, from: 'aws-billing@amazon.com', subject: 'AWS Billing Statement - November 2024',
      body: 'Your November statement is available in the AWS Console at https://aws.amazon.com/billing',
      isPhishing: false, indicators: ['Legitimate amazon.com domain', 'Links to real AWS', 'Normal billing notification']
    },
  ];
  res.render('labs/social/phishing', { title: 'Phishing Detection', labId: 'social-phishing', emails });
});

router.post('/phishing/check', (req, res) => {
  const { emailId, isPhishing } = req.body;
  const answers = { 1: true, 2: false, 3: true, 4: true, 5: false };
  const correct = answers[emailId] === isPhishing;
  res.json({ correct, flag: correct ? 'FLAG{phishing_detected}' : undefined });
});

// Lab 2: Pretexting
router.get('/pretexting', (req, res) => { res.render('labs/social/pretexting', { title: 'Pretexting Scenarios', labId: 'social-phishing' }); });

// Lab 3: Email Headers
router.get('/email-headers', (req, res) => {
  const headers = `Return-Path: <bounced@evil-server.ru>
Received: from mail.evil-server.ru (evil-server.ru [185.100.87.42])
    by mx.company.com with SMTP; Mon, 15 Jan 2024 09:23:41 -0500
Received: from localhost (unknown [10.0.0.1])
    by mail.evil-server.ru with ESMTP id ABC123
From: "IT Department" <it-support@company.com>
Reply-To: hacker@evil-server.ru
To: employee@company.com
Subject: Urgent: System Update Required
Date: Mon, 15 Jan 2024 09:23:00 -0500
X-Mailer: PhishKit v2.1
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"
X-Spam-Score: 8.5
Authentication-Results: mx.company.com; spf=fail; dkim=fail; dmarc=fail`;

  res.render('labs/social/email-headers', { title: 'Email Header Analysis', labId: 'social-phishing', headers });
});

// Lab 4: OSINT
router.get('/osint', (req, res) => { res.render('labs/social/osint', { title: 'OSINT Challenge', labId: 'social-phishing' }); });

router.get('/osint/profile', (req, res) => {
  res.json({
    username: 'h4ck3r_j0hn',
    realName: 'John Smith',
    email: 'j.smith1985@gmail.com',
    company: 'TechCorp Inc.',
    github: 'johnsmith-dev',
    twitter: '@j0hn_hacks',
    linkedin: 'john-smith-techcorp',
    birthday: '1985-03-15',
    pets: ['Max (golden retriever)', 'Whiskers (cat)'],
    hometown: 'Springfield, IL',
    highSchool: 'Springfield Central HS',
    favoriteTeam: 'Bears',
    hint: 'Common password patterns: petname+year, team+birthday, name+123',
    flag: 'FLAG{osint_master}'
  });
});

module.exports = router;
