# 💀 EliteHackLab - Ultimate Cybersecurity Practice Platform

> **Train Like a Pro. Think Like an Attacker. Defend Like an Elite.**

The most comprehensive self-hosted cybersecurity training lab — covering 40+ vulnerability types across 11+ categories with CTF-style flags, difficulty levels from beginner to elite, and hands-on interactive challenges.

## ⚠️ DISCLAIMER

**FOR EDUCATIONAL & AUTHORIZED TESTING PURPOSES ONLY.** This application is intentionally vulnerable by design. Never deploy on a public network. Never use techniques learned here against systems without explicit authorization.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

Open: http://localhost:3000

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Setup the database (creates SQLite DB with sample data)
npm run setup-db

# Start the server
npm start

# Or with auto-reload for development
npm run dev
```

Open: http://localhost:3000

---

## 📊 What's Included

### 🌐 Web Exploitation (24 labs)
| Lab | Difficulty | Techniques |
|-----|-----------|------------|
| SQL Injection (5 labs) | Easy-Hard | Basic, UNION, Blind, Login Bypass, Second-Order |
| Cross-Site Scripting (4 labs) | Easy-Hard | Reflected, Stored, DOM-Based, Filter Bypass |
| CSRF (3 labs) | Easy-Medium | Basic, Token Bypass, JSON CSRF |
| SSRF (3 labs) | Medium-Hard | Basic, Filter Bypass, Blind |
| Command Injection (3 labs) | Medium-Hard | Basic, Blind, Filter Bypass |
| File Upload (3 labs) | Easy-Medium | Unrestricted, Extension Bypass, Content-Type |
| Path Traversal/LFI (3 labs) | Medium-Hard | Basic, Filter Bypass, Local File Inclusion |

### 🔐 Authentication & Sessions (11 labs)
| Lab | Difficulty | Techniques |
|-----|-----------|------------|
| Auth Bypass (4 labs) | Easy-Medium | Brute Force, Session Fixation, Weak Reset, Enumeration |
| JWT Attacks (4 labs) | Easy-Hard | Algorithm None, Weak Secret, Role Tampering, KID Injection |
| IDOR (3 labs) | Easy-Medium | Message Access, API IDOR, Horizontal PrivEsc |

### 🔌 Network Security (5 labs)
- Port Scanning Simulation
- DNS Enumeration & Zone Transfer
- Packet Analysis (credential extraction)
- MITM Concepts
- ARP Spoofing Theory

### ☁️ Cloud Security (5 labs)
- S3 Bucket Misconfiguration
- Cloud Metadata (IMDS) Attack
- IAM Privilege Escalation
- Container Escape Concepts
- Serverless Injection

### 🔑 Cryptography (5 labs)
- Weak Hash Cracking (MD5/SHA1)
- ECB Mode Pattern Attack
- Padding Oracle Attack
- Key/Nonce Reuse (XOR)
- Weak Random Number Generator

### 🎭 Social Engineering (4 labs)
- Phishing Email Detection
- Pretexting Scenarios
- Email Header Analysis
- OSINT Challenge

### 📱 Mobile Security (4 labs)
- Insecure Data Storage
- Hardcoded Secrets in APK
- Certificate Pinning Bypass
- Deep Link Exploitation

### 🔍 Forensics & Reverse Engineering (5 labs)
- Steganography
- Log File Analysis
- Memory Dump Analysis
- Encoding & Obfuscation
- Binary Analysis Basics

### ⬆️ Privilege Escalation (5 labs)
- SUID Binary Exploitation
- Cron Job Hijacking
- Sudo Misconfiguration
- Kernel Exploit Concepts
- PATH Variable Hijacking

### 🔗 API Security (5 labs)
- Mass Assignment
- No Rate Limiting (OTP Brute Force)
- GraphQL Introspection
- NoSQL Injection
- API Key Exposure

### 💀 Advanced Attacks (16 labs)
- XXE (Basic, Blind, SSRF)
- SSTI (Basic, Sandbox Escape, Blind)
- Insecure Deserialization (Node.js, Cookie, YAML)
- Prototype Pollution (Basic, RCE, XSS)
- Race Conditions (Double-Spend, Coupon, Limit)
- WebSocket Attacks (Hijacking, XSS, No Auth)
- HTTP Request Smuggling
- CORS Misconfiguration
- Clickjacking
- Open Redirect

---

## 🚩 CTF System

Every lab has a hidden flag in format: `FLAG{...}`

- Submit flags to earn points
- Track progress on the Scoreboard
- Hints available for each challenge
- 40 unique flags across all labs

---

## 🛠️ Recommended Tools

| Tool | Purpose |
|------|---------|
| Burp Suite | HTTP proxy, intercepting/modifying requests |
| Python + requests | Scripting exploits and automation |
| cURL | Command-line HTTP testing |
| sqlmap | Automated SQL injection |
| Hashcat/John | Password/hash cracking |
| Wireshark | Network packet analysis |
| jwt_tool | JWT testing and cracking |
| wfuzz/ffuf | Fuzzing and brute force |
| Browser DevTools | DOM inspection, network analysis |

---

## 🏗️ Architecture

```
elite-hack-lab/
├── src/
│   ├── server.js          # Main Express server + WebSocket
│   └── routes/            # 25+ route files (one per vulnerability type)
├── views/
│   ├── dashboard.ejs      # Main dashboard
│   ├── scoreboard.ejs     # CTF scoreboard
│   └── labs/              # 75+ lab view templates
├── public/
│   ├── css/style.css      # Dark hacker theme
│   ├── js/main.js         # Client-side interactions
│   └── uploads/           # File upload lab storage
├── db/
│   └── setup.js           # Database initialization
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 📚 Learning Path

### 🌱 Beginner
1. SQL Injection - Login Bypass
2. XSS - Reflected
3. IDOR - Basic
4. File Upload - Unrestricted
5. Brute Force Attack
6. Phishing Detection

### 🔥 Intermediate
1. UNION SQL Injection
2. Stored XSS
3. SSRF
4. JWT Weak Secret
5. Path Traversal
6. Command Injection
7. NoSQL Injection

### 💀 Advanced
1. Blind SQL Injection
2. DOM XSS
3. SSTI
4. Prototype Pollution
5. Race Conditions
6. XXE
7. Deserialization

### 👑 Elite
1. HTTP Request Smuggling
2. Padding Oracle
3. Second-Order SQLi
4. KID Header Injection
5. WebSocket Hijacking
6. Prototype Pollution → RCE

---

## 🤝 Contributing

Add new labs by:
1. Creating a route in `src/routes/`
2. Creating views in `views/labs/`
3. Adding a flag in `db/setup.js`
4. Registering the route in `server.js`

---

## 📖 References

- [OWASP Top 10](https://owasp.org/Top10/)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [CWE/MITRE](https://cwe.mitre.org/)
- [HackTricks](https://book.hacktricks.xyz/)
- [GTFOBins](https://gtfobins.github.io/)
- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)

---

**Built for hackers, by hackers. Stay legal. Stay ethical. 🏴‍☠️**
