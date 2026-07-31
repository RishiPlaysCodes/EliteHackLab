// ============================================================
// EliteHackLab - CANONICAL FLAG REGISTRY (Single Source of Truth)
// ============================================================
// Every lab's flag, difficulty, points, and hint are defined here.
// Both db/setup.js (database seeding) and src/routes/labApi.js
// (runtime API responses) import from this file, guaranteeing that
// the flag revealed by a lab ALWAYS matches the flag the database
// accepts on submission. Do NOT hardcode flags anywhere else.

const FLAGS = {
  // ---------- Web Exploitation ----------
  'sqli-basic':        { flag: 'FLAG{sql_injection_101}',        difficulty: 'easy',   points: 10, hint: "Try a single quote ' to break the query, then ' OR 1=1 --" },
  'sqli-union':        { flag: 'FLAG{union_select_pro}',         difficulty: 'medium', points: 20, hint: 'Determine the column count with ORDER BY, then UNION SELECT from other tables' },
  'sqli-blind':        { flag: 'FLAG{blind_sqli_master}',        difficulty: 'hard',   points: 25, hint: 'Use boolean/time-based conditions and substr() to extract data character by character' },
  'xss-reflected':     { flag: 'FLAG{xss_reflected_pwned}',      difficulty: 'easy',   points: 10, hint: 'The search parameter is reflected unescaped. Try <script>alert(1)</script>' },
  'xss-stored':        { flag: 'FLAG{xss_stored_persistent}',    difficulty: 'medium', points: 20, hint: 'Comments are stored without sanitization and shown to all users' },
  'xss-dom':           { flag: 'FLAG{dom_xss_ninja}',            difficulty: 'hard',   points: 30, hint: 'The client-side JS writes location.hash into innerHTML' },
  'csrf-basic':        { flag: 'FLAG{csrf_token_missing}',       difficulty: 'easy',   points: 10, hint: 'The state-changing form has no anti-CSRF token' },
  'ssrf-basic':        { flag: 'FLAG{ssrf_internal_access}',     difficulty: 'medium', points: 25, hint: 'Point the URL fetcher at internal services or 169.254.169.254' },
  'file-upload':       { flag: 'FLAG{unrestricted_upload}',      difficulty: 'easy',   points: 15, hint: 'Upload a .php / .html file — there is no real validation' },
  'cmd-injection':     { flag: 'FLAG{command_injection_rce}',    difficulty: 'medium', points: 25, hint: 'Chain commands with ; | && or $() in the host field' },
  'path-traversal':    { flag: 'FLAG{path_traversal_lfi}',       difficulty: 'medium', points: 20, hint: 'Use ../../../../etc/passwd to escape the directory' },

  // ---------- Authentication & Sessions ----------
  'brute-force':       { flag: 'FLAG{brute_force_success}',      difficulty: 'easy',   points: 10, hint: 'No rate limiting — try common passwords for admin' },
  'session-fixation':  { flag: 'FLAG{session_fixed}',            difficulty: 'medium', points: 20, hint: 'The session id from the URL is not regenerated after login' },
  'idor-basic':        { flag: 'FLAG{idor_champion}',            difficulty: 'easy',   points: 10, hint: 'Increment/decrement the object id to read other users data' },
  'jwt-none':          { flag: 'FLAG{jwt_algorithm_none}',       difficulty: 'medium', points: 20, hint: 'Set the JWT header alg to "none" and drop the signature' },
  'jwt-weak-secret':   { flag: 'FLAG{jwt_weak_secret_cracked}',  difficulty: 'medium', points: 25, hint: 'The signing secret is a common word — crack and re-sign with role:admin' },

  // ---------- Network Security ----------
  'network-port-scan':       { flag: 'FLAG{nmap_scan_complete}',       difficulty: 'medium', points: 15, hint: 'Run an aggressive scan on 192.168.1.254 to find the hidden admin service' },
  'network-dns-enum':        { flag: 'FLAG{dns_zone_transfer}',        difficulty: 'medium', points: 20, hint: 'Zone transfer (AXFR) is allowed — it dumps every subdomain' },
  'network-packet-analysis': { flag: 'FLAG{s3cr3t_n3tw0rk_fl4g}',      difficulty: 'hard',   points: 25, hint: 'The FTP PASS command is in cleartext in the capture' },
  'network-mitm':            { flag: 'FLAG{mitm_traffic_intercepted}', difficulty: 'hard',   points: 25, hint: 'Start the attack then capture — the secret is in the intercepted stream' },
  'network-arp':             { flag: 'FLAG{arp_cache_poisoned}',       difficulty: 'medium', points: 20, hint: 'Send spoofed ARP replies mapping the gateway IP to your MAC' },

  // ---------- Cloud Security ----------
  'cloud-s3':          { flag: 'FLAG{s3_bucket_public_read}',    difficulty: 'easy',   points: 15, hint: 'Guess bucket names like hacklab-backup / hacklab-dev' },
  'cloud-metadata':    { flag: 'FLAG{imds_creds_stolen}',        difficulty: 'medium', points: 25, hint: 'Browse to /latest/meta-data/iam/security-credentials/' },
  'cloud-iam':         { flag: 'FLAG{iam_privilege_escalation}', difficulty: 'hard',   points: 30, hint: 'Enumerate policies, then attach an admin policy or assume an admin role' },
  'cloud-container':   { flag: 'FLAG{docker_escape_to_host}',    difficulty: 'hard',   points: 30, hint: 'The docker socket is mounted — or check dangerous capabilities' },
  'cloud-serverless':  { flag: 'FLAG{lambda_env_leaked}',        difficulty: 'medium', points: 25, hint: 'The Lambda eval()s event data — inject to read process.env' },

  // ---------- Cryptography ----------
  'crypto-weak-hash':      { flag: 'FLAG{md5_rainbow_cracked}',      difficulty: 'easy',   points: 10, hint: 'Unsalted MD5 — use a rainbow table / common passwords' },
  'crypto-ecb':            { flag: 'FLAG{ecb_byte_at_a_time}',       difficulty: 'medium', points: 20, hint: 'ECB blocks are deterministic — recover the secret one byte at a time' },
  'crypto-padding-oracle': { flag: 'FLAG{padding_oracle_decrypted}', difficulty: 'hard',   points: 40, hint: 'The oracle tells you when padding is valid — decrypt without the key' },
  'crypto-key-reuse':      { flag: 'FLAG{xor_key_reuse_broken}',     difficulty: 'medium', points: 20, hint: 'C1 XOR C2 = P1 XOR P2; with a known plaintext you recover the other' },
  'crypto-rng':            { flag: 'FLAG{predictable_rng_pwned}',    difficulty: 'hard',   points: 25, hint: 'The LCG is seeded predictably — replicate it and predict the next token' },

  // ---------- Social Engineering ----------
  'social-phishing':      { flag: 'FLAG{phishing_detected}',       difficulty: 'easy',   points: 10, hint: 'Look for lookalike domains, urgency, and mismatched links' },
  'social-pretexting':    { flag: 'FLAG{pretexting_social_eng}',    difficulty: 'medium', points: 15, hint: 'Combine an authority persona with urgency to extract info' },
  'social-email-headers': { flag: 'FLAG{spoofed_email_detected}',   difficulty: 'medium', points: 20, hint: 'Trace the Received headers bottom-up; check SPF/DKIM/DMARC failures' },
  'social-osint':         { flag: 'FLAG{osint_master}',             difficulty: 'medium', points: 20, hint: 'Combine WHOIS, GitHub and Pastebin findings' },

  // ---------- Mobile Security ----------
  'mobile-insecure-storage': { flag: 'FLAG{insecure_mobile_storage}', difficulty: 'easy',   points: 15, hint: 'Check shared_prefs and the SQLite databases folder' },
  'mobile-api-hardcoded':    { flag: 'FLAG{hardcoded_secrets_found}', difficulty: 'easy',   points: 15, hint: 'Grep the decompiled sources for api_key / secret / token' },
  'mobile-cert-pinning':     { flag: 'FLAG{ssl_pinning_bypassed}',   difficulty: 'hard',   points: 30, hint: 'Hook the pinning verify() with Frida and return true' },
  'mobile-deep-links':       { flag: 'FLAG{deep_link_hijack}',       difficulty: 'medium', points: 20, hint: 'Abuse the unvalidated redirect / auto-login deep link params' },

  // ---------- Forensics & Reverse Engineering ----------
  'forensics-stego':        { flag: 'FLAG{hidden_in_pixels}',        difficulty: 'medium', points: 20, hint: 'Try strings, exiftool, binwalk, then LSB extraction' },
  'forensics-log-analysis': { flag: 'FLAG{log_forensics_solved}',    difficulty: 'medium', points: 20, hint: 'Identify the attacker IP and the attack type from the log spike' },
  'forensics-memory':       { flag: 'FLAG{memory_dump_analyzed}',    difficulty: 'hard',   points: 35, hint: 'hashdump / cmdline reveal the credential string' },
  'forensics-encoding':     { flag: 'FLAG{enc0d1ng_m4st3r}',         difficulty: 'easy',   points: 10, hint: 'Decode each piece (base64, hex, rot13, binary, url) and concatenate' },
  'forensics-binary':       { flag: 'FLAG{reverse_engineered_pass}', difficulty: 'hard',   points: 35, hint: 'Read the disassembly to find the hardcoded password comparison' },

  // ---------- Privilege Escalation ----------
  'privesc-suid':      { flag: 'FLAG{suid_root_shell}',        difficulty: 'medium', points: 25, hint: 'Abuse an exploitable SUID binary (find/vim/python) via GTFOBins' },
  'privesc-cron':      { flag: 'FLAG{cron_job_hijacked}',      difficulty: 'medium', points: 25, hint: 'Write your payload into a world-writable root cron script' },
  'privesc-sudo':      { flag: 'FLAG{sudo_gtfobins_root}',     difficulty: 'easy',   points: 20, hint: 'sudo vim/find/awk/env can all spawn a root shell' },
  'privesc-kernel':    { flag: 'FLAG{kernel_exploit_root}',    difficulty: 'hard',   points: 35, hint: 'Match the kernel version to the right CVE (this box is old)' },
  'privesc-path':      { flag: 'FLAG{path_hijack_root}',       difficulty: 'medium', points: 25, hint: 'The SUID binary calls a program without a full path — hijack PATH' },

  // ---------- API Security ----------
  'api-mass-assignment': { flag: 'FLAG{mass_assignment_admin}', difficulty: 'medium', points: 20, hint: 'Add "role":"admin" (or isAdmin:true) to the JSON body' },
  'api-rate-limit':      { flag: 'FLAG{otp_brute_forced}',      difficulty: 'medium', points: 15, hint: 'No rate limit on the OTP endpoint — brute force 0000-9999' },
  'api-graphql':         { flag: 'FLAG{graphql_introspection_leak}', difficulty: 'medium', points: 20, hint: 'Run an introspection query, then call the hidden getFlag query' },
  'api-nosql':           { flag: 'FLAG{nosql_operator_bypass}',  difficulty: 'medium', points: 25, hint: 'Send {"password":{"$ne":""}} to bypass auth' },
  'api-key-exposure':    { flag: 'FLAG{hardcoded_api_key_found}', difficulty: 'easy',  points: 10, hint: 'The admin API key is in an HTML comment / page source' },

  // ---------- Advanced ----------
  'ssti-basic':            { flag: 'FLAG{ssti_template_rce}',       difficulty: 'hard', points: 35, hint: 'Confirm with {{7*7}} then escalate to code execution' },
  'xxe-basic':             { flag: 'FLAG{xxe_file_disclosure}',     difficulty: 'hard', points: 30, hint: 'Define an external entity pointing to file:///etc/passwd' },
  'deserialization':       { flag: 'FLAG{insecure_deserialize}',    difficulty: 'hard', points: 35, hint: 'Craft a serialized object that executes code on load' },
  'prototype-pollution':   { flag: 'FLAG{prototype_polluted}',      difficulty: 'hard', points: 40, hint: 'Send {"__proto__":{"isAdmin":true}} to the merge endpoint' },
  'race-condition':        { flag: 'FLAG{race_condition_won}',      difficulty: 'hard', points: 35, hint: 'Fire many concurrent requests to beat the check-then-act window' },
  'websocket-attack':      { flag: 'FLAG{websocket_hijacked}',      difficulty: 'hard', points: 30, hint: 'No origin/auth check — send an admin_command over the socket' },
  'advanced-clickjacking':   { flag: 'FLAG{clickjacking_ui_redress}',  difficulty: 'easy',   points: 10, hint: 'The target page has no X-Frame-Options — frame it transparently' },
  'advanced-cors':           { flag: 'FLAG{cors_origin_reflection}',   difficulty: 'medium', points: 20, hint: 'The API reflects any Origin with credentials:true' },
  'advanced-http-smuggling': { flag: 'FLAG{http_desync_smuggled}',     difficulty: 'hard',   points: 40, hint: 'Send both Content-Length and Transfer-Encoding (CL.TE / TE.CL)' },
  'advanced-open-redirect':  { flag: 'FLAG{open_redirect_to_evil}',    difficulty: 'easy',   points: 10, hint: 'The redirect param accepts external URLs like https://evil.com' },
};

module.exports = FLAGS;
