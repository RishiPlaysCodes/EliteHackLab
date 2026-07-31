const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('labs/api/index', {
    title: 'API Security Labs',
    labs: [
      { id: 'mass-assignment', name: 'Mass Assignment', difficulty: 'Medium', path: '/labs/api/mass-assignment' },
      { id: 'rate-limit', name: 'No Rate Limiting', difficulty: 'Easy', path: '/labs/api/rate-limit' },
      { id: 'graphql', name: 'GraphQL Introspection', difficulty: 'Medium', path: '/labs/api/graphql' },
      { id: 'nosql', name: 'NoSQL Injection', difficulty: 'Medium', path: '/labs/api/nosql' },
      { id: 'api-key', name: 'API Key Exposure', difficulty: 'Easy', path: '/labs/api/api-key' },
    ]
  });
});

// Lab 1: Mass Assignment
router.get('/mass-assignment', (req, res) => { res.render('labs/api/mass-assignment', { title: 'Mass Assignment', labId: 'api-mass-assignment' }); });

router.post('/mass-assignment/register', (req, res) => {
  // VULNERABLE: Accepts all fields from request body
  const user = { username: 'newuser', role: 'user', isAdmin: false, ...req.body };
  
  if (user.role === 'admin' || user.isAdmin === true || user.isAdmin === 'true') {
    res.json({ success: true, user, flag: 'FLAG{mass_assignment_admin}', message: 'You assigned yourself admin privileges!' });
  } else {
    res.json({ success: true, user, hint: 'Try adding role=admin or isAdmin=true to your request body' });
  }
});

// Lab 2: No Rate Limiting
let otpAttempts = {};
router.get('/rate-limit', (req, res) => { res.render('labs/api/rate-limit', { title: 'No Rate Limiting', labId: 'api-rate-limit' }); });

router.post('/rate-limit/verify-otp', (req, res) => {
  const { otp } = req.body;
  const correctOtp = '1337';
  
  // NO RATE LIMITING
  if (otp === correctOtp) {
    res.json({ success: true, flag: 'FLAG{no_rate_limit}', message: 'OTP verified! Account accessed.' });
  } else {
    res.json({ success: false, message: `Invalid OTP: ${otp}. No rate limiting - brute force it! (4 digits: 0000-9999)` });
  }
});

// Lab 3: GraphQL
router.get('/graphql', (req, res) => { res.render('labs/api/graphql', { title: 'GraphQL Introspection', labId: 'graphql-introspection' }); });

router.post('/graphql/query', (req, res) => {
  const { query } = req.body;
  
  if (query && query.includes('__schema')) {
    // Introspection query - reveals schema
    res.json({
      data: {
        __schema: {
          types: [
            { name: 'User', fields: ['id', 'username', 'email', 'password', 'role', 'ssn', 'creditCard'] },
            { name: 'Secret', fields: ['id', 'content', 'classification', 'owner'] },
            { name: 'AdminConfig', fields: ['apiKey', 'dbPassword', 'awsSecret', 'flag'] },
          ],
          mutations: ['createUser', 'deleteUser', 'escalatePrivileges', 'dumpDatabase'],
          queries: ['users', 'secrets', 'adminConfig', 'flag']
        }
      },
      flag: 'FLAG{graphql_exposed}'
    });
  } else if (query && (query.includes('adminConfig') || query.includes('flag'))) {
    res.json({ data: { adminConfig: { flag: 'FLAG{graphql_exposed}', dbPassword: 'admin123' } } });
  } else if (query && query.includes('users')) {
    res.json({ data: { users: [{ id: 1, username: 'admin', email: 'admin@lab.local', role: 'admin' }] } });
  } else {
    res.json({ data: null, hint: 'Try introspection: { __schema { types { name fields { name } } } }' });
  }
});

// Lab 4: NoSQL Injection
router.get('/nosql', (req, res) => { res.render('labs/api/nosql', { title: 'NoSQL Injection', labId: 'nosql-injection' }); });

router.post('/nosql/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulated MongoDB query - vulnerable to operator injection
  // In real MongoDB: db.users.find({username: username, password: password})
  // Attack: {"username":"admin","password":{"$ne":""}}
  
  if (typeof password === 'object' && password.$ne !== undefined) {
    res.json({ success: true, flag: 'FLAG{nosql_bypassed}', message: 'NoSQL injection successful! $ne operator bypassed authentication.' });
  } else if (typeof password === 'object' && password.$gt !== undefined) {
    res.json({ success: true, flag: 'FLAG{nosql_bypassed}', message: 'NoSQL injection with $gt operator!' });
  } else if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, message: 'Normal login' });
  } else {
    res.json({ success: false, message: 'Invalid credentials', hint: 'Try: {"username":"admin","password":{"$ne":""}}' });
  }
});

// Lab 5: API Key Exposure
router.get('/api-key', (req, res) => { res.render('labs/api/api-key', { title: 'API Key Exposure', labId: 'api-rate-limit' }); });

// Exposed in response headers, JS source, etc.
router.get('/api-key/config.js', (req, res) => {
  res.type('application/javascript').send(`
// TODO: Move to environment variables
const API_CONFIG = {
  baseUrl: "https://api.company.com/v2",
  apiKey: "sk-live-prod-key-FLAG{api_key_exposed}",
  secretKey: "sk_secret_production_key_12345",
  stripeKey: "pk_live_fake_stripe_key",
  firebaseConfig: { apiKey: "AIzaSyFAKE_KEY_12345" }
};
`);
});

module.exports = router;
