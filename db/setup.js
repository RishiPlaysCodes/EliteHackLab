const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'lab.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Users table (intentionally vulnerable for auth labs)
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user',
    api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Products table (for SQL injection labs)
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0
  );

  -- Comments table (for XSS labs)
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT NOT NULL,
    page TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Messages table (for IDOR labs)
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    subject TEXT,
    body TEXT,
    is_private INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Secrets table (for access control labs)
  CREATE TABLE IF NOT EXISTS secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER,
    title TEXT,
    content TEXT,
    classification TEXT DEFAULT 'confidential'
  );

  -- Sessions table (for session management labs)
  CREATE TABLE IF NOT EXISTS active_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_token TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );

  -- Logs table (for forensics labs)
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    user_id INTEGER,
    ip_address TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Files table (for file upload labs)
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    original_name TEXT,
    mimetype TEXT,
    size INTEGER,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Notes table (for XXE/Deserialization labs)
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    format TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Flags table (CTF-style flags for each lab)
  CREATE TABLE IF NOT EXISTS flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id TEXT UNIQUE,
    flag TEXT NOT NULL,
    difficulty TEXT,
    points INTEGER DEFAULT 10,
    hint TEXT
  );

  -- User progress tracking
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    lab_id TEXT,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    attempts INTEGER DEFAULT 0
  );
`);

// Insert sample users (intentionally weak passwords for labs)
const users = [
  { username: 'admin', password: 'admin123', email: 'admin@elitehacklab.local', role: 'admin', api_key: 'sk-admin-secret-key-12345' },
  { username: 'john', password: 'password', email: 'john@elitehacklab.local', role: 'user', api_key: 'sk-user-john-key-67890' },
  { username: 'alice', password: 'alice2024', email: 'alice@company.local', role: 'moderator', api_key: 'sk-mod-alice-key-11111' },
  { username: 'bob', password: 'qwerty', email: 'bob@elitehacklab.local', role: 'user', api_key: 'sk-user-bob-key-22222' },
  { username: 'secret_user', password: 'sup3r_s3cr3t!', email: 'hidden@elitehacklab.local', role: 'superadmin', api_key: 'sk-superadmin-master-99999' },
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, email, role, api_key) VALUES (?, ?, ?, ?, ?)');
users.forEach(u => {
  insertUser.run(u.username, u.password, u.email, u.role, u.api_key);
});

// Insert products
const products = [
  { name: 'Hacking Handbook', description: 'Complete guide to ethical hacking', price: 49.99, category: 'books', stock: 100, hidden: 0 },
  { name: 'USB Rubber Ducky', description: 'Keystroke injection tool', price: 79.99, category: 'hardware', stock: 50, hidden: 0 },
  { name: 'WiFi Pineapple', description: 'Network auditing platform', price: 199.99, category: 'hardware', stock: 25, hidden: 0 },
  { name: 'Secret Admin Panel Access', description: 'DO NOT DISPLAY - Internal use only', price: 0, category: 'internal', stock: 1, hidden: 1 },
  { name: 'Pentesting Laptop', description: 'Pre-configured with Kali Linux', price: 1499.99, category: 'hardware', stock: 10, hidden: 0 },
  { name: 'CTF Toolkit Pro', description: 'Professional CTF tools bundle', price: 299.99, category: 'software', stock: 999, hidden: 0 },
  { name: 'FLAG{sql_injection_master}', description: 'Hidden product - you found it!', price: 0, category: 'flags', stock: 1, hidden: 1 },
];

const insertProduct = db.prepare('INSERT OR IGNORE INTO products (name, description, price, category, stock, hidden) VALUES (?, ?, ?, ?, ?, ?)');
products.forEach(p => {
  insertProduct.run(p.name, p.description, p.price, p.category, p.stock, p.hidden);
});

// Insert messages
const messages = [
  { sender: 1, receiver: 2, subject: 'Welcome', body: 'Welcome to the platform, John!', private: 0 },
  { sender: 1, receiver: 1, subject: 'Admin Credentials Backup', body: 'Backup creds: admin/admin123 - Server root: r00t_p@ss!', private: 1 },
  { sender: 3, receiver: 1, subject: 'Security Report', body: 'Found vuln in /api/v1/internal - FLAG{idor_champion}', private: 1 },
  { sender: 2, receiver: 3, subject: 'Meeting', body: 'See you at the security meetup!', private: 0 },
  { sender: 5, receiver: 1, subject: 'TOP SECRET', body: 'New API endpoint deployed at /api/secret/dashboard - key: masterkey-2024', private: 1 },
];

const insertMsg = db.prepare('INSERT OR IGNORE INTO messages (sender_id, receiver_id, subject, body, is_private) VALUES (?, ?, ?, ?, ?)');
messages.forEach(m => {
  insertMsg.run(m.sender, m.receiver, m.subject, m.body, m.private);
});

// Insert secrets
const secrets = [
  { owner: 1, title: 'Server SSH Keys', content: 'SSH Private Key: -----BEGIN RSA PRIVATE KEY----- FLAG{access_control_bypassed} -----END RSA PRIVATE KEY-----', classification: 'top-secret' },
  { owner: 5, title: 'Database Backup Location', content: '/var/backups/db_dump_2024.sql - Password: backup_master_2024', classification: 'confidential' },
  { owner: 3, title: 'API Gateway Config', content: 'Gateway: https://internal-api.local:8443 - Token: eyJhbGciOiJub25lIn0', classification: 'restricted' },
];

const insertSecret = db.prepare('INSERT OR IGNORE INTO secrets (owner_id, title, content, classification) VALUES (?, ?, ?, ?)');
secrets.forEach(s => {
  insertSecret.run(s.owner, s.title, s.content, s.classification);
});

// Insert CTF Flags
const flags = [
  { lab_id: 'sqli-basic', flag: 'FLAG{sql_injection_101}', difficulty: 'easy', points: 10, hint: 'Try single quotes' },
  { lab_id: 'sqli-blind', flag: 'FLAG{blind_sqli_master}', difficulty: 'medium', points: 25, hint: 'Time-based or boolean-based' },
  { lab_id: 'sqli-union', flag: 'FLAG{union_select_pro}', difficulty: 'medium', points: 20, hint: 'How many columns?' },
  { lab_id: 'xss-reflected', flag: 'FLAG{xss_reflected_pwned}', difficulty: 'easy', points: 10, hint: 'Check the search parameter' },
  { lab_id: 'xss-stored', flag: 'FLAG{xss_stored_persistent}', difficulty: 'medium', points: 20, hint: 'Comments are dangerous' },
  { lab_id: 'xss-dom', flag: 'FLAG{dom_xss_ninja}', difficulty: 'hard', points: 30, hint: 'Check client-side rendering' },
  { lab_id: 'csrf-basic', flag: 'FLAG{csrf_token_missing}', difficulty: 'easy', points: 10, hint: 'No token validation' },
  { lab_id: 'ssrf-basic', flag: 'FLAG{ssrf_internal_access}', difficulty: 'medium', points: 25, hint: 'Try internal URLs' },
  { lab_id: 'file-upload', flag: 'FLAG{unrestricted_upload}', difficulty: 'easy', points: 15, hint: 'What file types are allowed?' },
  { lab_id: 'cmd-injection', flag: 'FLAG{command_injection_rce}', difficulty: 'medium', points: 25, hint: 'Semicolons and pipes' },
  { lab_id: 'idor-basic', flag: 'FLAG{idor_champion}', difficulty: 'easy', points: 10, hint: 'Change the ID' },
  { lab_id: 'jwt-none', flag: 'FLAG{jwt_algorithm_none}', difficulty: 'medium', points: 20, hint: 'Algorithm confusion' },
  { lab_id: 'jwt-weak-secret', flag: 'FLAG{jwt_weak_secret_cracked}', difficulty: 'medium', points: 25, hint: 'Brute force the secret' },
  { lab_id: 'xxe-basic', flag: 'FLAG{xxe_file_disclosure}', difficulty: 'hard', points: 30, hint: 'External entities' },
  { lab_id: 'ssti-basic', flag: 'FLAG{ssti_template_rce}', difficulty: 'hard', points: 35, hint: 'Template expressions' },
  { lab_id: 'deserialization', flag: 'FLAG{insecure_deserialize}', difficulty: 'hard', points: 35, hint: 'Object injection' },
  { lab_id: 'prototype-pollution', flag: 'FLAG{prototype_polluted}', difficulty: 'hard', points: 40, hint: '__proto__ manipulation' },
  { lab_id: 'race-condition', flag: 'FLAG{race_condition_won}', difficulty: 'hard', points: 35, hint: 'Send multiple requests simultaneously' },
  { lab_id: 'websocket-attack', flag: 'FLAG{websocket_hijacked}', difficulty: 'hard', points: 30, hint: 'No origin check' },
  { lab_id: 'path-traversal', flag: 'FLAG{path_traversal_lfi}', difficulty: 'medium', points: 20, hint: '../../../etc/passwd' },
  { lab_id: 'brute-force', flag: 'FLAG{brute_force_success}', difficulty: 'easy', points: 10, hint: 'Common passwords' },
  { lab_id: 'session-fixation', flag: 'FLAG{session_fixed}', difficulty: 'medium', points: 20, hint: 'Set session before auth' },
  { lab_id: 'clickjacking', flag: 'FLAG{clickjacked}', difficulty: 'easy', points: 10, hint: 'X-Frame-Options missing' },
  { lab_id: 'cors-misconfig', flag: 'FLAG{cors_wide_open}', difficulty: 'medium', points: 20, hint: 'Origin: null' },
  { lab_id: 'open-redirect', flag: 'FLAG{open_redirect_phish}', difficulty: 'easy', points: 10, hint: 'Redirect parameter' },
  { lab_id: 'crypto-weak-hash', flag: 'FLAG{md5_is_broken}', difficulty: 'easy', points: 10, hint: 'Rainbow tables' },
  { lab_id: 'crypto-ecb-mode', flag: 'FLAG{ecb_penguin}', difficulty: 'medium', points: 20, hint: 'Block patterns' },
  { lab_id: 'crypto-padding-oracle', flag: 'FLAG{padding_oracle_decrypted}', difficulty: 'hard', points: 40, hint: 'Error messages differ' },
  { lab_id: 'privesc-suid', flag: 'FLAG{suid_root_shell}', difficulty: 'medium', points: 25, hint: 'Find SUID binaries' },
  { lab_id: 'privesc-cron', flag: 'FLAG{cron_job_hijacked}', difficulty: 'medium', points: 25, hint: 'Writable cron scripts' },
  { lab_id: 'cloud-s3-open', flag: 'FLAG{s3_bucket_exposed}', difficulty: 'easy', points: 15, hint: 'Public bucket listing' },
  { lab_id: 'cloud-metadata', flag: 'FLAG{imds_token_stolen}', difficulty: 'medium', points: 25, hint: '169.254.169.254' },
  { lab_id: 'forensics-stego', flag: 'FLAG{hidden_in_pixels}', difficulty: 'medium', points: 20, hint: 'LSB encoding' },
  { lab_id: 'forensics-memory', flag: 'FLAG{memory_dump_analyzed}', difficulty: 'hard', points: 35, hint: 'Process listing' },
  { lab_id: 'social-phishing', flag: 'FLAG{phishing_detected}', difficulty: 'easy', points: 10, hint: 'Check the URL carefully' },
  { lab_id: 'api-mass-assignment', flag: 'FLAG{mass_assignment_admin}', difficulty: 'medium', points: 20, hint: 'Extra parameters in POST' },
  { lab_id: 'api-rate-limit', flag: 'FLAG{no_rate_limit}', difficulty: 'easy', points: 10, hint: 'Send many requests' },
  { lab_id: 'graphql-introspection', flag: 'FLAG{graphql_exposed}', difficulty: 'medium', points: 20, hint: '__schema query' },
  { lab_id: 'nosql-injection', flag: 'FLAG{nosql_bypassed}', difficulty: 'medium', points: 25, hint: '$ne operator' },
  { lab_id: 'http-smuggling', flag: 'FLAG{request_smuggled}', difficulty: 'hard', points: 40, hint: 'CL.TE or TE.CL' },
];

const insertFlag = db.prepare('INSERT OR IGNORE INTO flags (lab_id, flag, difficulty, points, hint) VALUES (?, ?, ?, ?, ?)');
flags.forEach(f => {
  insertFlag.run(f.lab_id, f.flag, f.difficulty, f.points, f.hint);
});

console.log('✅ Database setup complete!');
console.log(`📊 Created tables: users, products, comments, messages, secrets, active_sessions, audit_logs, uploaded_files, notes, flags, progress`);
console.log(`👤 Users: ${users.length}`);
console.log(`🏷️  Products: ${products.length}`);
console.log(`💬 Messages: ${messages.length}`);
console.log(`🚩 CTF Flags: ${flags.length}`);
console.log('\n🎯 Lab is ready for hacking practice!');

db.close();
