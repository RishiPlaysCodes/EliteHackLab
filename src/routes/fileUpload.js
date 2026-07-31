const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// INTENTIONALLY VULNERABLE - No file type validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname) // Keeps original name (vulnerable)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// File Upload Labs Landing
router.get('/', (req, res) => {
  res.render('labs/fileupload/index', {
    title: 'File Upload Vulnerability Labs',
    labs: [
      { id: 'basic', name: 'Unrestricted File Upload', difficulty: 'Easy', path: '/labs/file-upload/basic' },
      { id: 'bypass', name: 'Extension Filter Bypass', difficulty: 'Medium', path: '/labs/file-upload/bypass' },
      { id: 'content-type', name: 'Content-Type Bypass', difficulty: 'Medium', path: '/labs/file-upload/content-type' },
    ]
  });
});

// Lab 1: Unrestricted File Upload
router.get('/basic', (req, res) => {
  const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
  res.render('labs/fileupload/basic', {
    title: 'Unrestricted File Upload',
    labId: 'file-upload',
    files,
    message: null
  });
});

router.post('/basic/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.redirect('/labs/file-upload/basic');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let message = `File uploaded: ${req.file.originalname} (${req.file.size} bytes)`;
  
  // Check if they uploaded a "dangerous" file
  const dangerous = ['.php', '.jsp', '.asp', '.aspx', '.exe', '.sh', '.py', '.js', '.html'];
  if (dangerous.includes(ext)) {
    message += `\n\n🎯 You uploaded a potentially dangerous file type (${ext})!\nFLAG{unrestricted_upload}\n\nIn a real scenario, this could lead to Remote Code Execution.`;
  }

  const files = fs.readdirSync(uploadDir);
  res.render('labs/fileupload/basic', {
    title: 'Unrestricted File Upload',
    labId: 'file-upload',
    files,
    message
  });
});

// Lab 2: Extension Filter Bypass
router.get('/bypass', (req, res) => {
  res.render('labs/fileupload/bypass', {
    title: 'Extension Filter Bypass',
    labId: 'file-upload',
    message: null
  });
});

router.post('/bypass/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  
  // Weak filter - only blocks .php and .jsp
  const blocked = ['.php', '.jsp'];
  if (blocked.includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.json({ success: false, message: `File type ${ext} is blocked!` });
  }

  // But doesn't block: .php5, .phtml, .php.jpg, .htaccess, .svg (with script), etc.
  let flag = '';
  const bypasses = ['.php5', '.phtml', '.php.jpg', '.htaccess', '.svg', '.shtml', '.php3'];
  if (bypasses.some(b => req.file.originalname.includes(b)) || req.file.originalname.includes('.php.')) {
    flag = 'FLAG{unrestricted_upload}';
  }

  res.json({
    success: true,
    message: `File "${req.file.originalname}" uploaded successfully!`,
    flag: flag || undefined,
    note: flag ? 'Filter bypassed!' : 'File uploaded but try to bypass the extension filter'
  });
});

// Lab 3: Content-Type Bypass
router.get('/content-type', (req, res) => {
  res.render('labs/fileupload/content-type', {
    title: 'Content-Type Bypass',
    labId: 'file-upload',
    message: null
  });
});

router.post('/content-type/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: 'No file uploaded' });
  }

  // Only checks Content-Type header (easily spoofed)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    fs.unlinkSync(req.file.path);
    return res.json({ 
      success: false, 
      message: `Content-Type "${req.file.mimetype}" not allowed. Only images accepted.`,
      hint: 'The server only checks the Content-Type header, not the actual file content...'
    });
  }

  // Accepts it if Content-Type says image, even if file is actually PHP/script
  const ext = path.extname(req.file.originalname).toLowerCase();
  let flag = '';
  if (['.php', '.jsp', '.html', '.js', '.py', '.sh'].includes(ext)) {
    flag = 'FLAG{unrestricted_upload}';
  }

  res.json({
    success: true,
    message: `File "${req.file.originalname}" uploaded (Content-Type: ${req.file.mimetype})`,
    flag: flag || undefined,
    note: flag ? 'You bypassed the Content-Type check! The server only validated the MIME type header.' : 'Upload accepted'
  });
});

// Reset uploads
router.post('/reset', (req, res) => {
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    files.forEach(f => fs.unlinkSync(path.join(uploadDir, f)));
  }
  res.json({ success: true, message: 'Uploads cleared' });
});

module.exports = router;
