const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// WebSocket server (intentionally no origin check - for websocket labs)
const wss = new WebSocket.Server({ server, path: '/ws' });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Intentionally weak session config (for session labs)
app.use(session({
  secret: 'super-weak-secret-123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: false }
}));

// Intentionally permissive CORS (for CORS labs)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  // Intentionally NO X-Frame-Options (for clickjacking labs)
  // Intentionally NO CSP (for XSS labs)
  next();
});

// Database connection
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'db', 'lab.db');
let db;
try {
  // Auto-create database if it doesn't exist (happens on fresh deploy)
  const fs = require('fs');
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found — running setup...');
    require('child_process').execSync('node ' + path.join(__dirname, '..', 'db', 'setup.js'), { stdio: 'inherit' });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.error('Database error:', err.message);
  console.error('Run: npm run setup-db');
  process.exit(1);
}

// Make db available to routes
app.locals.db = db;

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const sqliRoutes = require('./routes/sqli');
const xssRoutes = require('./routes/xss');
const csrfRoutes = require('./routes/csrf');
const authRoutes = require('./routes/auth');
const fileUploadRoutes = require('./routes/fileUpload');
const cmdInjectionRoutes = require('./routes/cmdInjection');
const ssrfRoutes = require('./routes/ssrf');
const idorRoutes = require('./routes/idor');
const jwtRoutes = require('./routes/jwt');
const xxeRoutes = require('./routes/xxe');
const sstiRoutes = require('./routes/ssti');
const deserializationRoutes = require('./routes/deserialization');
const prototypeRoutes = require('./routes/prototypePollution');
const raceConditionRoutes = require('./routes/raceCondition');
const pathTraversalRoutes = require('./routes/pathTraversal');
const cryptoRoutes = require('./routes/crypto');
const networkRoutes = require('./routes/network');
const cloudRoutes = require('./routes/cloud');
const forensicsRoutes = require('./routes/forensics');
const socialRoutes = require('./routes/social');
const mobileRoutes = require('./routes/mobile');
const privescRoutes = require('./routes/privesc');
const apiRoutes = require('./routes/api');
const websocketRoutes = require('./routes/websocket');
const advancedRoutes = require('./routes/advanced');
const flagRoutes = require('./routes/flags');
const labApiRoutes = require('./routes/labApi');
const FLAGS = require('../db/flags');

// Register routes
app.use('/', dashboardRoutes);
app.use('/labs/sqli', sqliRoutes);
app.use('/labs/xss', xssRoutes);
app.use('/labs/csrf', csrfRoutes);
app.use('/labs/auth', authRoutes);
app.use('/labs/file-upload', fileUploadRoutes);
app.use('/labs/cmd-injection', cmdInjectionRoutes);
app.use('/labs/ssrf', ssrfRoutes);
app.use('/labs/idor', idorRoutes);
app.use('/labs/jwt', jwtRoutes);
app.use('/labs/xxe', xxeRoutes);
app.use('/labs/ssti', sstiRoutes);
app.use('/labs/deserialization', deserializationRoutes);
app.use('/labs/prototype-pollution', prototypeRoutes);
app.use('/labs/race-condition', raceConditionRoutes);
app.use('/labs/path-traversal', pathTraversalRoutes);
app.use('/labs/crypto', cryptoRoutes);
app.use('/labs/network', networkRoutes);
app.use('/labs/cloud', cloudRoutes);
app.use('/labs/forensics', forensicsRoutes);
app.use('/labs/social', socialRoutes);
app.use('/labs/mobile', mobileRoutes);
app.use('/labs/privesc', privescRoutes);
app.use('/labs/api', apiRoutes);
app.use('/labs/websocket', websocketRoutes);
app.use('/labs/advanced', advancedRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/labs', labApiRoutes);

// WebSocket handler (intentionally vulnerable)
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    // Guard against non-JSON payloads so a malformed frame can't crash the server
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    // No authentication check - vulnerable (intentional for the lab)
    if (data.type === 'admin_command') {
      // Command execution without auth
      ws.send(JSON.stringify({
        type: 'response',
        data: `Executed: ${data.command}`,
        flag: FLAGS['websocket-attack'].flag
      }));
    } else if (data.type === 'chat') {
      // Broadcast to all clients (no sanitization)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'chat',
            user: data.user,
            message: data.message // No sanitization - XSS via WebSocket
          }));
        }
      });
    } else {
      ws.send(JSON.stringify({ type: 'info', message: 'Unknown command type' }));
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Intentionally verbose errors (information disclosure)
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: req.query,
    body: req.body
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { url: req.url });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ███████╗██╗     ██╗████████╗███████╗                    ║
║     ██╔════╝██║     ██║╚══██╔══╝██╔════╝                    ║
║     █████╗  ██║     ██║   ██║   █████╗                      ║
║     ██╔══╝  ██║     ██║   ██║   ██╔══╝                      ║
║     ███████╗███████╗██║   ██║   ███████╗                    ║
║     ╚══════╝╚══════╝╚═╝   ╚═╝   ╚══════╝                    ║
║                                                              ║
║     ██╗  ██╗ █████╗  ██████╗██╗  ██╗                        ║
║     ██║  ██║██╔══██╗██╔════╝██║ ██╔╝                        ║
║     ███████║███████║██║     █████╔╝                          ║
║     ██╔══██║██╔══██║██║     ██╔═██╗                          ║
║     ██║  ██║██║  ██║╚██████╗██║  ██╗                        ║
║     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝                        ║
║                                                              ║
║     ██╗      █████╗ ██████╗                                  ║
║     ██║     ██╔══██╗██╔══██╗                                 ║
║     ██║     ███████║██████╔╝                                 ║
║     ██║     ██╔══██║██╔══██╗                                 ║
║     ███████╗██║  ██║██████╔╝                                 ║
║     ╚══════╝╚═╝  ╚═╝╚═════╝                                  ║
║                                                              ║
║  🎯 Ultimate Cybersecurity Practice Lab                      ║
║  ⚠️  FOR EDUCATIONAL PURPOSES ONLY                           ║
║  🌐 Running on http://localhost:${PORT}                         ║
║  📊 40+ Vulnerability Labs | 10+ Categories                 ║
║  🚩 CTF Flags embedded in every lab                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, wss };
