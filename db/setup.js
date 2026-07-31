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
  { name: 'FLAG{sql_injection_101}', description: 'Hidden product - you found it!', price: 0, category: 'flags', stock: 1, hidden: 1 },
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

// Insert CTF Flags — sourced from the single canonical registry (db/flags.js)
// so the flag stored in the DB always matches the flag revealed by each lab.
const FLAG_REGISTRY = require('./flags');
const flags = Object.keys(FLAG_REGISTRY).map(labId => ({
  lab_id: labId,
  flag: FLAG_REGISTRY[labId].flag,
  difficulty: FLAG_REGISTRY[labId].difficulty,
  points: FLAG_REGISTRY[labId].points,
  hint: FLAG_REGISTRY[labId].hint
}));

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
