const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/advanced/index', {
    title: 'Advanced Attack Labs',
    labs: [
      { id: 'http-smuggling', name: 'HTTP Request Smuggling', difficulty: 'Elite', path: '/labs/advanced/http-smuggling' },
      { id: 'cors', name: 'CORS Misconfiguration', difficulty: 'Medium', path: '/labs/advanced/cors' },
      { id: 'clickjacking', name: 'Clickjacking', difficulty: 'Easy', path: '/labs/advanced/clickjacking' },
      { id: 'open-redirect', name: 'Open Redirect', difficulty: 'Easy', path: '/labs/advanced/open-redirect' },
    ]
  });
});

// CORS Misconfiguration
router.get('/cors', (req, res) => { res.render('labs/advanced/cors', { title: 'CORS Misconfiguration', labId: 'cors-misconfig' }); });

router.get('/cors/secret-api', (req, res) => {
  // VULNERABLE: Reflects any Origin header
  const origin = req.headers.origin || 'null';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.json({ secret: 'admin_api_key_12345', user: 'admin', flag: 'FLAG{cors_wide_open}' });
});

// Clickjacking
router.get('/clickjacking', (req, res) => { res.render('labs/advanced/clickjacking', { title: 'Clickjacking', labId: 'clickjacking' }); });

router.get('/clickjacking/target', (req, res) => {
  // No X-Frame-Options header → can be framed
  res.send(`<html><body style="font-family:sans-serif;padding:2rem;">
    <h2>Admin Panel - Account Settings</h2>
    <form action="/labs/advanced/clickjacking/delete" method="POST">
      <p>Click below to update your profile picture:</p>
      <button type="submit" style="padding:1rem 2rem;font-size:1.2rem;background:#ff4444;color:white;border:none;border-radius:8px;cursor:pointer;">Update Profile</button>
      <p style="font-size:0.7rem;color:#999;">(Actually deletes your account)</p>
    </form>
  </body></html>`);
});

router.post('/clickjacking/delete', (req, res) => {
  res.json({ message: 'Account deleted! (The victim clicked the hidden button)', flag: 'FLAG{clickjacked}' });
});

// Open Redirect
router.get('/open-redirect', (req, res) => { res.render('labs/advanced/open-redirect', { title: 'Open Redirect', labId: 'open-redirect' }); });

router.get('/open-redirect/login', (req, res) => {
  const returnUrl = req.query.return || '/';
  // VULNERABLE: No URL validation
  res.send(`<html><body style="font-family:sans-serif;padding:2rem;background:#0a0a0f;color:#e0e0e0;">
    <h2>Login Successful!</h2>
    <p>Redirecting to: <code>${returnUrl}</code></p>
    <p>FLAG{open_redirect_phish}</p>
    <a href="${returnUrl}" style="color:#00ff41;">Click here if not redirected</a>
    <script>if("${returnUrl}".startsWith("http"))document.write('<p style="color:#ff4444;">⚠️ OPEN REDIRECT! Could send user to phishing site!</p>')</script>
  </body></html>`);
});

// HTTP Request Smuggling (concept demonstration)
router.get('/http-smuggling', (req, res) => { res.render('labs/advanced/http-smuggling', { title: 'HTTP Smuggling', labId: 'http-smuggling' }); });

router.post('/http-smuggling/test', (req, res) => {
  const contentLength = req.headers['content-length'];
  const transferEncoding = req.headers['transfer-encoding'];
  
  if (contentLength && transferEncoding) {
    res.json({
      success: true,
      flag: 'FLAG{request_smuggled}',
      message: 'Both Content-Length and Transfer-Encoding present! This can cause request smuggling.',
      cl: contentLength,
      te: transferEncoding
    });
  } else {
    res.json({
      success: false,
      hint: 'Send a request with BOTH Content-Length and Transfer-Encoding headers to trigger CL.TE or TE.CL smuggling'
    });
  }
});

module.exports = router;
