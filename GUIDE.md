# 🎓 EliteHackLab — Player Guide & Walkthroughs

> A practical, TryHackMe-style guide: how the lab works, how to "connect",
> the toolkit you need, and step-by-step walkthroughs (with spoilers) for
> every one of the 60+ challenges.

---

## 1. What this lab IS (and what it is NOT) — read this first

**EliteHackLab is a self-hosted, deliberately-vulnerable web application** in the
same family as **OWASP Juice Shop, DVWA, and PortSwigger Web Security Academy.**
You run ONE web app and attack it from your browser + tools like Burp/curl.

It is **NOT** a network range of separate victim virtual machines that you attack
over an OpenVPN tunnel (that is the HackTheBox / TryHackMe "attack a remote box"
model). That model needs a full virtualization/container fabric spinning up a fresh
Linux/Windows VM per user per room — a fundamentally heavier infrastructure than a
single Node.js app.

**What that means for you:**
- ✅ You get 60+ hands-on, flag-based challenges across 14 categories.
- ✅ Network / cloud / mobile / forensics labs are **realistic guided simulations**
  (the server emulates nmap, IMDS, ADB, Volatility, Frida, etc. and gives you the
  flag when you perform the correct action).
- ✅ The web/crypto/auth/API labs are **genuinely exploitable** with real payloads.
- ❌ There is no VPN and no separate root shell on a real remote VM.

If later you want the "real VM over VPN" experience too, see
**Section 6: Growing into a full cyber range** at the end — I explain exactly how.

---

## 2. Running the lab

### Local (recommended for practice)
```bash
git clone https://github.com/RishiPlaysCodes/EliteHackLab.git
cd EliteHackLab
npm install
npm run setup-db      # seeds the SQLite database + all flags
npm start             # http://localhost:3000
```

### Docker (one command)
```bash
docker-compose up --build
```

### First run checklist
- Open http://localhost:3000 — you should see the dashboard with 14 categories.
- Open the **Scoreboard** — it should load with 0 solves.
- Pick **SQL Injection → Login Bypass** as your first, easiest win.

---

## 3. The toolkit (install these on your own machine)

| Tool | Use in this lab |
|------|-----------------|
| **Browser DevTools** | Inspect DOM, network requests, edit/replay requests |
| **Burp Suite (Community)** | Intercept & tamper requests — essential for upload/JWT/CORS labs |
| **curl** | Fast API testing and sending raw JSON bodies |
| **Python 3 + requests** | Automating brute force, blind SQLi, byte-at-a-time crypto |
| **jwt_tool / jwt.io** | Decode, tamper and re-sign JWTs |
| **hashcat / John** | Crack the MD5/SHA1 hashes in the crypto labs |
| **CyberChef** | Decode base64/hex/rot13/binary in the encoding lab |

---


## 4. How flags work

Every challenge hides a flag in the format `FLAG{...}`. When you perform the
correct exploit, the server response contains the flag. Copy it into the
**"Capture The Flag"** box on that lab page and submit — you earn points and it
shows on the Scoreboard. Stuck? Click **Get Hint** on any lab.

All flags live in one file: `db/flags.js` (the single source of truth). The flag
a lab reveals is guaranteed to be the exact flag the submit box accepts.

---

## 5. Walkthroughs (⚠️ SPOILERS)

> Try each challenge yourself first. These are the intended solution paths.

### 🌐 Web Exploitation

**SQL Injection — Login Bypass** (`sqli-basic`)
- In the login form enter username `admin' --` and any password.
- The `--` comments out the password check → you log in as admin.
- Alternatively `' OR 1=1 --`. Flag: `FLAG{sql_injection_101}`.

**SQL Injection — UNION** (`sqli-union`)
- Find the column count: `' ORDER BY 5 --` (increase until error).
- Extract data: `' UNION SELECT flag,lab_id,3,4 FROM flags --`.

**SQL Injection — Blind** (`sqli-blind`)
- Boolean: `1 AND (SELECT substr(password,1,1) FROM users WHERE username='admin')='a'`.
- Automate character extraction with a Python loop over the response differences.

**Reflected XSS** (`xss-reflected`)
- In the search box: `<script>alert('XSS')</script>` (it renders unescaped).

**Stored XSS** (`xss-stored`)
- Post a comment: `<img src=x onerror=alert(document.cookie)>` — runs for every viewer.

**DOM XSS** (`xss-dom`)
- Put `#<img src=x onerror=alert(1)>` in the URL fragment; JS writes it to innerHTML.

**CSRF** (`csrf-basic`)
- The change-email form has no token. Build an auto-submitting HTML form pointing
  at `/labs/csrf/basic/change-email` and it succeeds cross-site.

**SSRF** (`ssrf-basic`)
- In the URL fetcher enter `http://169.254.169.254/latest/meta-data/` or an internal
  service URL; the server fetches it and leaks internal data.

**File Upload** (`file-upload`)
- Upload `shell.php` (or `.html`). No validation → flag returned.

**Command Injection** (`cmd-injection`)
- Host field: `8.8.8.8; id` or `8.8.8.8 && whoami`.

**Path Traversal** (`path-traversal`)
- File field: `../../../../etc/passwd`.

### 🔐 Auth & Sessions

**Brute Force** (`brute-force`) — no rate limit; try `admin` with `password`,
`admin123`, `123456`. Automate with a small wordlist.

**Session Fixation** (`session-fixation`) — set the session id via the URL,
victim logs in, session isn't rotated → you reuse it.

**IDOR** (`idor-basic`) — change the numeric id (e.g. `/user/1`, `/message/2`)
to read other users' data.

**JWT alg=none** (`jwt-none`) — decode the token, set header `{"alg":"none"}`,
payload `role":"admin"`, drop the signature (keep trailing dot).

**JWT weak secret** (`jwt-weak-secret`) — crack the secret (`hashcat -m 16500`),
re-sign with `role:admin`.


### 🔌 Network

- **Port Scan** (`network-port-scan`) — scan `192.168.1.254` with the *Aggressive*
  option; the `8443` service version contains the flag.
- **DNS Enum** (`network-dns-enum`) — query type **TXT** or **AXFR** on `hacklab.local`;
  the `_secret` TXT record holds the flag.
- **Packet Analysis** (`network-packet-analysis`) — the FTP `PASS` line is cleartext:
  the password is the flag body.
- **MITM** (`network-mitm`) — Start attack, then Capture; the intercepted stream
  contains the secret.
- **ARP** (`network-arp`) — run the spoof; the confirmation message contains the flag.

### ☁️ Cloud

- **S3** (`cloud-s3`) — enumerate bucket `hacklab-dev` or `hacklab-backup` (public).
- **IMDS Metadata** (`cloud-metadata`) — browse
  `/latest/meta-data/iam/security-credentials/admin-role`.
- **IAM** (`cloud-iam`) — `list-attached-user-policies`, then attach `AdministratorAccess`.
- **Container Escape** (`cloud-container`) — `ls -la /var/run/docker.sock` (it's mounted).
- **Serverless** (`cloud-serverless`) — event data `{"name":"x";return process.env}`.

### 🔑 Cryptography

- **Weak Hash** (`crypto-weak-hash`) — crack `5f4dcc3b...` = `password`; submit and get flag.
- **ECB** (`crypto-ecb`) — byte-at-a-time: send shrinking `A` blocks and match ciphertext
  blocks to recover the appended secret (which IS the flag).
- **Padding Oracle** (`crypto-padding-oracle`) — the oracle reports padding validity;
  use padbuster-style logic (guided/conceptual lab).
- **Key Reuse** (`crypto-key-reuse`) — enter both ciphertexts + the known plaintext;
  the tool recovers the other message via `C1⊕C2⊕P2`.
- **Weak RNG** (`crypto-rng`) — pull a token, replicate the LCG
  `state=(state*1103515245+12345)&0x7fffffff`, predict the next.

### 🎭 Social Engineering

- **Phishing** (`social-phishing`) — mark #1,#3,#4 phishing and #2,#5 legit → all correct.
- **Email Headers** (`social-email-headers`) — true IP `185.100.87.42`, spoofed = yes.
- **OSINT** (`social-osint`) — use the **GitHub** or **Pastebin** tool on `hackcorp.com`.
- **Pretexting** (`social-pretexting`) — persona *Executive/IT-Admin* + an urgent message
  asking for a password reset.

### 📱 Mobile

- **Insecure Storage** (`mobile-insecure-storage`) — browse to
  `/data/data/com.hacklab.app/shared_prefs/auth.xml`.
- **Hardcoded Secrets** (`mobile-api-hardcoded`) — grep pattern `secret`.
- **Cert Pinning** (`mobile-cert-pinning`) — run the Frida script that returns true.
- **Deep Links** (`mobile-deep-links`) — `hacklab://app/login?redirect=https://evil.com`.

### 🔍 Forensics

- **Stego** (`forensics-stego`) — run **LSB extraction** (or steghide with a passphrase).
- **Log Analysis** (`forensics-log-analysis`) — attacker IP `185.100.87.42`, type `SQL Injection`.
- **Memory** (`forensics-memory`) — run **hashdump**.
- **Encoding** (`forensics-encoding`) — decode each piece and concatenate.
- **Binary** (`forensics-binary`) — disassemble → password `sup3r_s3cr3t` → run it.

### ⬆️ Privilege Escalation

- **SUID** (`privesc-suid`) — `find . -exec /bin/sh -p \;`.
- **Cron** (`privesc-cron`) — target `/opt/scripts/cleanup.sh` (world-writable).
- **Sudo** (`privesc-sudo`) — `vim -c ':!/bin/sh'`.
- **Kernel** (`privesc-kernel`) — box is 3.13 → choose **DirtyCOW** or **OverlayFS**.
- **PATH** (`privesc-path`) — payload `/bin/bash -p` in `/tmp`, prepend `/tmp` to PATH.

### 🔗 API

- **Mass Assignment** (`api-mass-assignment`) — add `"role":"admin"` to the JSON body.
- **Rate Limit** (`api-rate-limit`) — click **Brute Force** (OTP is `1337`).
- **GraphQL** (`api-graphql`) — introspect, then run `{ getFlag }`.
- **NoSQL** (`api-nosql`) — password `{"$ne":""}`.
- **API Key** (`api-key-exposure`) — view page source comment for the key, call `/api/admin/flag`.

### 💀 Advanced

- **SSTI** (`ssti-basic`) — `{{7*7}}` to confirm, then the RCE payload.
- **XXE** (`xxe-basic`) — external entity `SYSTEM "file:///etc/passwd"`.
- **Deserialization** (`deserialization`) — `node-serialize` IIFE payload.
- **Prototype Pollution** (`prototype-pollution`) — `{"__proto__":{"isAdmin":true}}`.
- **Race Condition** (`race-condition`) — fire 10+ concurrent withdrawals.
- **WebSocket** (`websocket-attack`) — connect, send `{"type":"admin_command",...}`.
- **Clickjacking** (`advanced-clickjacking`) — Test Attack (target is framable).
- **CORS** (`advanced-cors`) — origin `https://evil.com` is reflected with credentials.
- **HTTP Smuggling** (`advanced-http-smuggling`) — send CL + TE headers with a smuggled `GET /admin`.
- **Open Redirect** (`advanced-open-redirect`) — `https://evil.com`.

---

## 6. Growing into a full cyber range (optional, advanced)

If you want the true "attack a remote box over VPN" experience like TryHackMe/HTB:
1. Add **Docker containers as target machines** (e.g. Metasploitable2, a vulnerable
   WordPress, VulnHub images) alongside this app via `docker-compose`.
2. Put an **OpenVPN or WireGuard** server in front so players connect into a private
   subnet and reach those target containers by IP.
3. Keep EliteHackLab as the **web/CTF portal** and scoreboard.

This turns the project into a hybrid: a web-CTF portal PLUS a bootable target
network. It's a bigger infra project — ask me and I can scaffold the compose file
and VPN config when you're ready.

---

**Stay legal. Only attack systems you own or are authorized to test.** 🏴‍☠️
