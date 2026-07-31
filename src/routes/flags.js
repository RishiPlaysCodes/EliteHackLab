const express = require('express');
const router = express.Router();

// Submit a flag
router.post('/submit', (req, res) => {
  const db = req.app.locals.db;
  const { lab_id, flag, user_id } = req.body;

  if (!lab_id || !flag) {
    return res.json({ success: false, message: 'Missing lab_id or flag' });
  }

  const labFlag = db.prepare('SELECT * FROM flags WHERE lab_id = ?').get(lab_id);
  
  if (!labFlag) {
    return res.json({ success: false, message: 'Invalid lab ID' });
  }

  if (labFlag.flag === flag) {
    // Record progress
    const userId = user_id || 1;
    db.prepare(`
      INSERT OR REPLACE INTO progress (user_id, lab_id, completed, completed_at, attempts)
      VALUES (?, ?, 1, datetime('now'), COALESCE((SELECT attempts FROM progress WHERE user_id = ? AND lab_id = ?), 0) + 1)
    `).run(userId, lab_id, userId, lab_id);

    return res.json({ 
      success: true, 
      message: `🎉 Correct! +${labFlag.points} points!`,
      points: labFlag.points
    });
  } else {
    // Record attempt
    const userId = user_id || 1;
    db.prepare(`
      INSERT OR REPLACE INTO progress (user_id, lab_id, completed, attempts)
      VALUES (?, ?, 0, COALESCE((SELECT attempts FROM progress WHERE user_id = ? AND lab_id = ?), 0) + 1)
    `).run(userId, lab_id, userId, lab_id);

    return res.json({ success: false, message: 'Incorrect flag. Keep trying!' });
  }
});

// Get hint
router.get('/hint/:lab_id', (req, res) => {
  const db = req.app.locals.db;
  const flag = db.prepare('SELECT hint, difficulty, points FROM flags WHERE lab_id = ?').get(req.params.lab_id);
  
  if (!flag) {
    return res.json({ error: 'Lab not found' });
  }

  res.json({ hint: flag.hint, difficulty: flag.difficulty, points: flag.points });
});

// Get progress
router.get('/progress/:user_id', (req, res) => {
  const db = req.app.locals.db;
  const progress = db.prepare(`
    SELECT p.*, f.points, f.difficulty 
    FROM progress p 
    JOIN flags f ON p.lab_id = f.lab_id 
    WHERE p.user_id = ?
  `).all(req.params.user_id);
  
  res.json({ progress });
});

module.exports = router;
