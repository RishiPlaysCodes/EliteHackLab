# 📖 EliteHackLab - Complete Technical Documentation

> **Author:** RishiPlaysCodes  
> **Version:** 1.0.0  
> **License:** Educational Use Only  
> **Total Files:** 161 | **Total Lines of Code:** 10,850+

---

## 🏗️ Architecture Overview

EliteHackLab is a **monolithic Node.js web application** built with Express.js that serves as a self-hosted, intentionally vulnerable cybersecurity practice platform. It uses server-side rendering (EJS templates), SQLite database, and WebSocket for real-time labs.

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ HTML/CSS │  │    JS    │  │  WebSocket Client │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼──────────────┼─────────────────┼────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                EXPRESS.JS SERVER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Routes  │  │Middleware│  │  WebSocket (ws)   │  │
│  │ (25 files)│  │(CORS,etc)│  │  (No Auth!)      │  │
│  └────┬─────┘  └──────────┘  └──────────────────┘  │
│       │                                              │
│       ▼                                              │
│  ┌──────────┐  ┌──────────┐                        │
│  │EJS Views │  │  SQLite  │                        │
│  │(120 files)│  │ Database │                        │
│  └──────────┘  └──────────┘                        │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Explained



| Technology | Role | Why Used |
|-----------|------|----------|
| **Node.js** | Runtime | JavaScript server-side execution, single-threaded event loop perfect for simulating race conditions |
| **Express.js** | Web Framework | Minimal, flexible HTTP framework — easy to make intentionally vulnerable without built-in protections |
| **EJS** | Template Engine | Server-side HTML rendering — allows demonstrating SSTI, XSS via unescaped output (`<%-`) |
| **SQLite (better-sqlite3)** | Database | Zero-config, file-based SQL database — perfect for SQL injection labs without external DB setup |
| **WebSocket (ws)** | Real-time | Native WebSocket server for demonstrating WS hijacking, no-auth commands, XSS via messages |
| **JSON Web Tokens (jsonwebtoken)** | Auth Tokens | JWT generation/verification — intentionally weak secret and algorithm none acceptance |
| **Multer** | File Uploads | Handles multipart form data — configured without file type validation (intentionally) |
| **cookie-parser** | Cookies | Parse HTTP cookies — enables cookie manipulation and session labs |
| **express-session** | Sessions | Session management with intentionally weak config (no httpOnly, predictable secret) |
| **crypto / CryptoJS** | Cryptography | Node.js crypto module for AES, hashing, and intentionally weak crypto implementations |
| **xml2js** | XML Parsing | XML parser that processes external entities (XXE vulnerability) |
| **node-forge** | Crypto Ops | Additional crypto operations for padding oracle and advanced crypto labs |
| **Docker** | Deployment | Containerized deployment for isolation — one command to run everything |

---

## 📁 File Structure Explained

### `/src/server.js` — Main Application Entry Point
- Creates Express app with all middleware
- Sets up WebSocket server on `/ws` path (no origin check = vulnerable)
- Configures intentionally weak session (predictable secret, no httpOnly)
- Sets permissive CORS headers (reflects any origin)
- NO Content-Security-Policy header (allows XSS)
- NO X-Frame-Options (allows clickjacking)
- Verbose error handler that leaks stack traces
- Imports and mounts all 25 route modules

### `/db/setup.js` — Database Initialization
- Creates SQLite database with 11 tables
- Inserts sample users with weak plaintext passwords
- Inserts products (some hidden for SQLi discovery)
- Inserts private messages (for IDOR labs)
- Inserts secrets with classification levels
- Registers 40 CTF flags with points and hints
- Creates progress tracking table

### `/public/css/style.css` — Dark Hacker Theme
- CSS variables for neon color palette (green, blue, purple, red)
- Matrix-style background with radial gradients
- Terminal-style code blocks
- Responsive grid for lab categories
- Animated glitch text effect
- Custom scrollbar styling
- Modal for flag submission

### `/public/js/main.js` — Client-Side Interactions
- `submitFlagInline()` — AJAX flag submission to `/api/flags/submit`
- `getHint()` — Fetches hints from `/api/flags/hint/:id`
- `createConfetti()` — Celebration animation on correct flag
- Modal open/close handlers
- Keyboard shortcuts (ESC to close)

---

## 🔬 Route Files — Detailed Explanation



### `src/routes/sqli.js` — SQL Injection (5 Labs)
- **Basic:** Product search with string concatenation in WHERE clause — `'%${search}%'` enables injection
- **UNION:** Category filter vulnerable to UNION SELECT — attacker can extract from any table
- **Blind (Boolean):** Returns only true/false — forces character-by-character extraction
- **Blind (Time):** Simulates time-based blind with delayed responses
- **Login Bypass:** Classic `' OR '1'='1' --` authentication bypass
- **Second-Order:** Stores payload safely via parameterized INSERT, but uses it raw in a later SELECT

### `src/routes/xss.js` — Cross-Site Scripting (4 Labs)
- **Reflected:** Search parameter rendered with `<%-` (unescaped EJS) — immediate XSS
- **Stored:** Comments saved to DB without sanitization, rendered to all viewers
- **DOM-Based:** Client-side JS reads `location.hash` and writes to `innerHTML` — pure client-side vuln
- **Filter Bypass:** Server strips `<script>`, `javascript:`, `on*=` — but not nested/encoded variants

### `src/routes/csrf.js` — Cross-Site Request Forgery (3 Labs)
- **Basic:** Email/password change endpoints with NO token validation at all
- **Token Bypass:** Has a token field but only checks if it EXISTS, not if it's VALID
- **JSON CSRF:** JSON API with no origin/referer check + permissive CORS

### `src/routes/ssrf.js` — Server-Side Request Forgery (3 Labs)
- **Basic:** URL fetcher makes server-side requests to user-supplied URLs including localhost
- **Filter Bypass:** Blocks "127.0.0.1"/"localhost" but not hex/octal/IPv6/decimal representations
- **Blind:** Webhook URL parameter — server makes outbound request but doesn't show response

### `src/routes/cmdInjection.js` — Command Injection (3 Labs)
- **Basic:** Ping tool — detects `;`, `|`, `&&`, `` ` ``, `$()` in host input = RCE
- **Blind:** Email notification — uses time-based detection (sleep command injection)
- **Filter Bypass:** Blacklists special chars but misses newline injection (`%0a`)

### `src/routes/fileUpload.js` — File Upload (3 Labs)
- **Basic:** No validation whatsoever — accepts .php, .jsp, .html, anything
- **Extension Bypass:** Blocks .php/.jsp but not .php5, .phtml, .php.jpg, .htaccess
- **Content-Type:** Only checks MIME type header (spoofable with Burp/curl)

### `src/routes/pathTraversal.js` — Path Traversal / LFI (3 Labs)
- **Basic:** File reader with no path sanitization — `../../../../etc/passwd` works
- **Filter Bypass:** Removes `../` once — bypassed with `....//` (double traversal)
- **LFI:** Page parameter included as template — traversal loads system files



### `src/routes/auth.js` — Authentication Bypass (4 Labs)
- **Brute Force:** Login endpoint with ZERO rate limiting — unlimited attempts allowed
- **Session Fixation:** Accepts session ID from URL `?sid=` and doesn't regenerate after login
- **Weak Reset:** Password reset token is `Date.now().toString(36)` — fully predictable
- **Username Enumeration:** Different error messages reveal if username exists vs wrong password

### `src/routes/jwt.js` — JWT Token Attacks (4 Labs)
- **Algorithm None:** Server accepts tokens with `"alg":"none"` — no signature needed
- **Weak Secret:** Secret is literally `"secret"` — crackable with any wordlist in seconds
- **Role Tampering:** Decode JWT → change `role:"user"` to `role:"admin"` → re-sign
- **KID Injection:** KID header value used in file path — path traversal to empty key file

### `src/routes/idor.js` — Insecure Direct Object Reference (3 Labs)
- **Basic:** `/message/:id` — no ownership check, any user reads any message
- **API IDOR:** `/user/:id` — enumerate all users including admin's API keys
- **Horizontal:** `/secrets/:id` — access top-secret documents without authorization

### `src/routes/network.js` — Network Security (5 Labs)
- **Port Scan:** Simulated network with 7 hosts, each with realistic services and vulnerabilities
- **DNS Enum:** Zone transfer (AXFR) enabled — reveals all subdomains including hidden ones
- **Packet Analysis:** Pre-captured packets showing credentials in cleartext HTTP
- **MITM:** Theoretical explanation with attack flow diagrams
- **ARP Spoofing:** Theory of ARP cache poisoning attacks

### `src/routes/cloud.js` — Cloud Security (5 Labs)
- **S3 Buckets:** Simulated buckets with public-read-write ACL — listing and file access
- **IMDS Metadata:** Full AWS 169.254.169.254 simulation with IAM credentials
- **IAM PrivEsc:** Assume-role API allows escalation to admin role
- **Container Escape:** Theory of Docker breakout techniques
- **Serverless:** Lambda function with eval() — inject `process.env` to dump secrets

### `src/routes/crypto.js` — Cryptography (5 Labs)
- **Weak Hash:** MD5/SHA1 hashes of common passwords — crack with rainbow tables
- **ECB Mode:** AES-128-ECB oracle — identical blocks reveal patterns
- **Padding Oracle:** AES-CBC with error message that reveals valid/invalid padding
- **Key Reuse:** Three messages XORed with same key — XOR ciphertexts to reveal plaintexts
- **Weak RNG:** Linear Congruential Generator with known parameters — predict next token

### `src/routes/social.js` — Social Engineering (4 Labs)
- **Phishing:** 5 emails to classify as phishing/legitimate — teaches indicator detection
- **Pretexting:** Social engineering scenario training
- **Email Headers:** Analyze full headers to identify spoofed sender and origin
- **OSINT:** Gather personal info from a target profile to guess passwords

### `src/routes/mobile.js` — Mobile Security (4 Labs)
- **Insecure Storage:** Exposes plaintext credentials, tokens, PII in localStorage/SQLite
- **Hardcoded Secrets:** Simulated APK decompilation reveals API keys, AWS creds, Firebase URLs
- **Cert Pinning:** Theory of bypassing SSL pinning with Frida/Objection
- **Deep Links:** Unvalidated deep link handler allows auto-login and XSS via WebView



### `src/routes/forensics.js` — Digital Forensics (5 Labs)
- **Steganography:** Image with LSB-encoded hidden message + EXIF metadata clues
- **Log Analysis:** Realistic attack timeline in auth logs — identify attacker IP, method, persistence
- **Memory Dump:** Process list with hidden backdoors, network connections to C2, credential strings
- **Encoding:** 6 challenges (Base64, Hex, ROT13, Binary, URL encode, Morse code)
- **Binary Analysis:** Concepts of reverse engineering and binary examination

### `src/routes/privesc.js` — Privilege Escalation (5 Labs)
- **SUID:** Lists SUID binaries with exploitable ones (python3, vim, find) — GTFOBins style
- **Cron Jobs:** World-writable cron scripts running as root — inject reverse shell
- **Sudo Misconfig:** `sudo vim`, `sudo find`, `sudo awk` — all spawn root shells
- **Kernel:** Theory of kernel exploits (DirtyCow, etc.) with version detection
- **PATH Hijacking:** SUID binary calls `cat` without full path — create malicious `cat` in /tmp

### `src/routes/api.js` — API Security (5 Labs)
- **Mass Assignment:** Accepts all fields from POST body — add `role:admin` or `isAdmin:true`
- **Rate Limit:** 4-digit OTP with no rate limiting — brute force 0000-9999
- **GraphQL:** Introspection enabled — `__schema` query reveals all types including AdminConfig
- **NoSQL Injection:** MongoDB operator injection — `{"password":{"$ne":""}}` bypasses auth
- **API Key Exposure:** Keys hardcoded in `/api-key/config.js` — exposed in client-side JS

### `src/routes/xxe.js` — XML External Entity (3 Labs)
- **Basic:** XML parser with DTD/ENTITY enabled — `file:///etc/passwd` read via entity expansion
- **Blind:** No output reflected — use OOB (out-of-band) DTD to exfiltrate data
- **SSRF via XXE:** Use SYSTEM entity with `http://` URLs to access internal services

### `src/routes/ssti.js` — Server-Side Template Injection (3 Labs)
- **Basic:** Template input evaluated — `{{7*7}}` = 49 confirms injection, escalate to RCE
- **Sandbox Escape:** MRO chain traversal to reach `os.popen()` from string object
- **Blind:** No output — time-based or OOB exfiltration techniques

### `src/routes/deserialization.js` — Insecure Deserialization (3 Labs)
- **Node.js:** `_$$ND_FUNC$$_` payload triggers function execution during deserialization
- **Cookie:** Base64-encoded JSON cookie — decode, modify `isAdmin:true`, re-encode
- **YAML:** `!!python/object` or `!!js/function` tags execute code during YAML.load()

### `src/routes/prototypePollution.js` — Prototype Pollution (3 Labs)
- **Basic:** Unsafe deep merge with `__proto__` — pollutes Object.prototype globally
- **RCE:** Chain with child_process spawn options or EJS outputFunctionName
- **XSS:** Pollute innerHTML/srcdoc properties used by DOM rendering libraries

### `src/routes/raceCondition.js` — Race Conditions (3 Labs)
- **Double-Spend:** Balance check → 100ms delay → deduct. Send concurrent requests = overdraw
- **Coupon Reuse:** `couponUsed` flag set after 50ms delay — race window allows multiple redemptions
- **Limit Bypass:** Daily limit checked before increment — concurrent requests bypass counter

### `src/routes/websocket.js` — WebSocket Attacks (3 Labs)
- **Hijacking:** No Origin header validation — any website can connect and send commands
- **XSS:** Chat messages broadcast without sanitization — `innerHTML` renders attacker's HTML
- **No Auth:** `admin_command` message type executed without checking who sent it

### `src/routes/advanced.js` — Advanced Attacks (4 Labs)
- **HTTP Smuggling:** Detects when both Content-Length and Transfer-Encoding are present
- **CORS Misconfig:** Reflects any Origin header + allows credentials = full data theft
- **Clickjacking:** Target page has no X-Frame-Options — frameable by attacker's page
- **Open Redirect:** `?return=` parameter used in redirect without URL validation

---



## 🚩 CTF Flag System

### How It Works
1. Each lab has a hidden flag in format `FLAG{description}`
2. Flags are stored in SQLite `flags` table with lab_id, difficulty, points, and hint
3. Users submit flags via `/api/flags/submit` POST endpoint
4. Progress tracked per user in `progress` table
5. Scoreboard aggregates points across all completed labs

### All 40 Flags

| Lab ID | Flag | Points | Difficulty |
|--------|------|--------|-----------|
| sqli-basic | `FLAG{sql_injection_101}` | 10 | Easy |
| sqli-blind | `FLAG{blind_sqli_master}` | 25 | Medium |
| sqli-union | `FLAG{union_select_pro}` | 20 | Medium |
| xss-reflected | `FLAG{xss_reflected_pwned}` | 10 | Easy |
| xss-stored | `FLAG{xss_stored_persistent}` | 20 | Medium |
| xss-dom | `FLAG{dom_xss_ninja}` | 30 | Hard |
| csrf-basic | `FLAG{csrf_token_missing}` | 10 | Easy |
| ssrf-basic | `FLAG{ssrf_internal_access}` | 25 | Medium |
| file-upload | `FLAG{unrestricted_upload}` | 15 | Easy |
| cmd-injection | `FLAG{command_injection_rce}` | 25 | Medium |
| idor-basic | `FLAG{idor_champion}` | 10 | Easy |
| jwt-none | `FLAG{jwt_algorithm_none}` | 20 | Medium |
| jwt-weak-secret | `FLAG{jwt_weak_secret_cracked}` | 25 | Medium |
| xxe-basic | `FLAG{xxe_file_disclosure}` | 30 | Hard |
| ssti-basic | `FLAG{ssti_template_rce}` | 35 | Hard |
| deserialization | `FLAG{insecure_deserialize}` | 35 | Hard |
| prototype-pollution | `FLAG{prototype_polluted}` | 40 | Hard |
| race-condition | `FLAG{race_condition_won}` | 35 | Hard |
| websocket-attack | `FLAG{websocket_hijacked}` | 30 | Hard |
| path-traversal | `FLAG{path_traversal_lfi}` | 20 | Medium |
| brute-force | `FLAG{brute_force_success}` | 10 | Easy |
| session-fixation | `FLAG{session_fixed}` | 20 | Medium |
| clickjacking | `FLAG{clickjacked}` | 10 | Easy |
| cors-misconfig | `FLAG{cors_wide_open}` | 20 | Medium |
| open-redirect | `FLAG{open_redirect_phish}` | 10 | Easy |
| crypto-weak-hash | `FLAG{md5_is_broken}` | 10 | Easy |
| crypto-ecb-mode | `FLAG{ecb_penguin}` | 20 | Medium |
| crypto-padding-oracle | `FLAG{padding_oracle_decrypted}` | 40 | Hard |
| privesc-suid | `FLAG{suid_root_shell}` | 25 | Medium |
| privesc-cron | `FLAG{cron_job_hijacked}` | 25 | Medium |
| cloud-s3-open | `FLAG{s3_bucket_exposed}` | 15 | Easy |
| cloud-metadata | `FLAG{imds_token_stolen}` | 25 | Medium |
| forensics-stego | `FLAG{hidden_in_pixels}` | 20 | Medium |
| forensics-memory | `FLAG{memory_dump_analyzed}` | 35 | Hard |
| social-phishing | `FLAG{phishing_detected}` | 10 | Easy |
| api-mass-assignment | `FLAG{mass_assignment_admin}` | 20 | Medium |
| api-rate-limit | `FLAG{no_rate_limit}` | 10 | Easy |
| graphql-introspection | `FLAG{graphql_exposed}` | 20 | Medium |
| nosql-injection | `FLAG{nosql_bypassed}` | 25 | Medium |
| http-smuggling | `FLAG{request_smuggled}` | 40 | Hard |

**Total Points Available:** 870

---

## 🔒 Intentional Vulnerabilities Summary

| Security Control | Status | Why |
|-----------------|--------|-----|
| CSRF Tokens | ❌ Missing | CSRF labs |
| Content-Security-Policy | ❌ None | XSS labs |
| X-Frame-Options | ❌ None | Clickjacking |
| Rate Limiting | ❌ None | Brute force labs |
| Input Sanitization | ❌ None | SQLi, XSS, CMDi |
| Parameterized Queries | ❌ String concat | SQLi labs |
| File Type Validation | ❌ Minimal | Upload labs |
| Session Regeneration | ❌ Never | Session fixation |
| JWT Algorithm Whitelist | ❌ Accepts "none" | JWT labs |
| CORS Policy | ❌ Reflects origin | CORS labs |
| WebSocket Origin Check | ❌ None | WS hijacking |
| Error Messages | ❌ Verbose | Info disclosure |
| Password Hashing | ❌ Plaintext | Auth labs |
| Access Control | ❌ No auth checks | IDOR labs |

---

## 🖥️ How to Deploy

```bash
# Clone
git clone https://github.com/RishiPlaysCodes/EliteHackLab.git
cd EliteHackLab

# Install
npm install

# Setup database
npm run setup-db

# Run
npm start
# → http://localhost:3000

# OR with Docker:
docker-compose up --build
```

---

**Built with ❤️ by RishiPlaysCodes | For Educational Use Only**
