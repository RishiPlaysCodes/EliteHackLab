const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

router.get('/', (req, res) => {
  res.render('labs/crypto/index', {
    title: 'Cryptography Labs',
    labs: [
      { id: 'weak-hash', name: 'Weak Hash Cracking', difficulty: 'Easy', path: '/labs/crypto/weak-hash' },
      { id: 'ecb-mode', name: 'ECB Mode Attack', difficulty: 'Medium', path: '/labs/crypto/ecb-mode' },
      { id: 'padding-oracle', name: 'Padding Oracle Attack', difficulty: 'Hard', path: '/labs/crypto/padding-oracle' },
      { id: 'key-reuse', name: 'Key/Nonce Reuse', difficulty: 'Medium', path: '/labs/crypto/key-reuse' },
      { id: 'rng', name: 'Weak Random Number Generator', difficulty: 'Medium', path: '/labs/crypto/rng' },
    ]
  });
});

// Lab 1: Weak Hashing
router.get('/weak-hash', (req, res) => {
  const hashes = [
    { algorithm: 'MD5', hash: crypto.createHash('md5').update('password').digest('hex'), hint: 'Very common password' },
    { algorithm: 'MD5', hash: crypto.createHash('md5').update('admin123').digest('hex'), hint: 'Admin + numbers' },
    { algorithm: 'SHA1', hash: crypto.createHash('sha1').update('letmein').digest('hex'), hint: 'Please...' },
    { algorithm: 'MD5', hash: crypto.createHash('md5').update('FLAG{md5_is_broken}').digest('hex'), hint: 'The flag itself is the password' },
  ];
  res.render('labs/crypto/weak-hash', { title: 'Weak Hash Cracking', labId: 'crypto-weak-hash', hashes });
});

router.post('/weak-hash/check', (req, res) => {
  const { plaintext, hash, algorithm } = req.body;
  const computed = crypto.createHash(algorithm.toLowerCase()).update(plaintext).digest('hex');
  const match = computed === hash;
  res.json({ success: match, computed, original: hash, flag: match ? 'FLAG{md5_is_broken}' : undefined });
});

// Lab 2: ECB Mode
router.get('/ecb-mode', (req, res) => { res.render('labs/crypto/ecb-mode', { title: 'ECB Mode Attack', labId: 'crypto-ecb-mode' }); });

router.post('/ecb-mode/encrypt', (req, res) => {
  const { plaintext } = req.body;
  const key = 'ThisIs16ByteKey!'; // 16 bytes for AES-128
  
  // ECB mode - same plaintext block = same ciphertext block
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Split into 16-byte (32 hex char) blocks to show pattern
  const blocks = encrypted.match(/.{32}/g) || [encrypted];
  
  res.json({
    ciphertext: encrypted,
    blocks,
    blockCount: blocks.length,
    hint: 'Notice identical plaintext blocks produce identical ciphertext blocks!',
    flag: blocks.length > 2 && new Set(blocks).size < blocks.length ? 'FLAG{ecb_penguin}' : undefined
  });
});

// Lab 3: Padding Oracle
const ORACLE_KEY = Buffer.from('0123456789abcdef');
const ORACLE_IV = Buffer.from('fedcba9876543210');

router.get('/padding-oracle', (req, res) => {
  // Encrypt a secret message
  const secret = 'FLAG{padding_oracle_decrypted}!!';
  const cipher = crypto.createCipheriv('aes-128-cbc', ORACLE_KEY, ORACLE_IV);
  let enc = cipher.update(secret, 'utf8', 'hex');
  enc += cipher.final('hex');
  
  res.render('labs/crypto/padding-oracle', { title: 'Padding Oracle', labId: 'crypto-padding-oracle', ciphertext: enc, iv: ORACLE_IV.toString('hex') });
});

router.post('/padding-oracle/decrypt', (req, res) => {
  const { ciphertext, iv } = req.body;
  
  try {
    const decipher = crypto.createDecipheriv('aes-128-cbc', ORACLE_KEY, Buffer.from(iv, 'hex'));
    let dec = decipher.update(ciphertext, 'hex', 'utf8');
    dec += decipher.final('utf8');
    res.json({ success: true, valid_padding: true, plaintext: dec });
  } catch (e) {
    // VULNERABLE: Reveals padding validity
    if (e.message.includes('bad decrypt') || e.message.includes('wrong final block')) {
      res.json({ success: false, valid_padding: false, error: 'PADDING_ERROR' });
    } else {
      res.json({ success: false, valid_padding: true, error: 'DECRYPTION_ERROR' });
    }
  }
});

// Lab 4: Key Reuse (XOR)
router.get('/key-reuse', (req, res) => { res.render('labs/crypto/key-reuse', { title: 'Key/Nonce Reuse', labId: 'crypto-ecb-mode' }); });

router.get('/key-reuse/ciphertexts', (req, res) => {
  const key = 'SUPERSECRETKEY!!';
  const messages = [
    'The secret meeting is at noon',
    'FLAG{key_reuse_is_dangerous}!!',
    'Send the money to account 1337',
  ];
  
  // XOR with same key (stream cipher reuse)
  const ciphertexts = messages.map(m => {
    let result = '';
    for (let i = 0; i < m.length; i++) {
      result += (m.charCodeAt(i) ^ key.charCodeAt(i % key.length)).toString(16).padStart(2, '0');
    }
    return result;
  });
  
  res.json({ ciphertexts, hint: 'Same key used for all! XOR c1⊕c2 = m1⊕m2. Known plaintext attack possible.' });
});

// Lab 5: Weak RNG
router.get('/rng', (req, res) => { res.render('labs/crypto/rng', { title: 'Weak RNG', labId: 'crypto-ecb-mode' }); });

let rngSeed = 12345; // Predictable seed
function weakRandom() {
  rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
  return rngSeed;
}

router.get('/rng/token', (req, res) => {
  const token = weakRandom().toString(16);
  res.json({ token, hint: 'LCG with known parameters. Predict the next token!' });
});

router.post('/rng/predict', (req, res) => {
  const { prediction } = req.body;
  const next = weakRandom().toString(16);
  if (prediction === next) {
    res.json({ success: true, flag: 'FLAG{rng_predicted}', message: 'You predicted the next token!' });
  } else {
    res.json({ success: false, actual: next, message: 'Wrong prediction. The RNG uses LCG: seed = (seed * 1103515245 + 12345) & 0x7fffffff' });
  }
});

module.exports = router;
