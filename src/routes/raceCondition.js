const express = require('express');
const router = express.Router();

let accountBalance = 1000;
let couponUsed = false;

router.get('/', (req, res) => {
  res.render('labs/race/index', {
    title: 'Race Condition Labs',
    labs: [
      { id: 'balance', name: 'Double-Spend Attack', difficulty: 'Hard', path: '/labs/race-condition/balance' },
      { id: 'coupon', name: 'Coupon Reuse', difficulty: 'Hard', path: '/labs/race-condition/coupon' },
      { id: 'limit', name: 'Limit Bypass', difficulty: 'Hard', path: '/labs/race-condition/limit' },
    ]
  });
});

// Reset state
router.post('/reset', (req, res) => {
  accountBalance = 1000;
  couponUsed = false;
  res.json({ success: true, message: 'Lab reset', balance: accountBalance });
});

// Lab 1: Double-Spend
router.get('/balance', (req, res) => { res.render('labs/race/balance', { title: 'Double-Spend', labId: 'race-condition', balance: accountBalance }); });

router.post('/balance/withdraw', (req, res) => {
  const amount = parseInt(req.body.amount) || 500;
  
  // VULNERABLE: Check-then-act without locking (TOCTOU)
  if (accountBalance >= amount) {
    // Simulate processing delay
    setTimeout(() => {
      accountBalance -= amount;
      const flag = accountBalance < 0 ? 'FLAG{race_condition_won}' : undefined;
      res.json({ success: true, withdrawn: amount, balance: accountBalance, flag });
    }, 100); // Delay creates race window
  } else {
    res.json({ success: false, message: 'Insufficient funds', balance: accountBalance });
  }
});

router.get('/balance/check', (req, res) => {
  res.json({ balance: accountBalance, flag: accountBalance < 0 ? 'FLAG{race_condition_won}' : undefined });
});

// Lab 2: Coupon Reuse
router.get('/coupon', (req, res) => { res.render('labs/race/coupon', { title: 'Coupon Reuse', labId: 'race-condition', couponUsed }); });

router.post('/coupon/redeem', (req, res) => {
  const { code } = req.body;
  
  if (code !== 'DISCOUNT50') return res.json({ success: false, message: 'Invalid coupon' });
  
  // VULNERABLE: Race condition between check and update
  if (!couponUsed) {
    setTimeout(() => {
      couponUsed = true;
      accountBalance += 500; // Add coupon value
      res.json({ success: true, message: 'Coupon applied! +$500', balance: accountBalance });
    }, 50);
  } else {
    res.json({ success: false, message: 'Coupon already used', balance: accountBalance });
  }
});

// Lab 3: Limit Bypass
let dailyTransfers = 0;
router.get('/limit', (req, res) => { res.render('labs/race/limit', { title: 'Limit Bypass', labId: 'race-condition', transfers: dailyTransfers }); });

router.post('/limit/transfer', (req, res) => {
  // VULNERABLE: Check limit then increment — race window
  if (dailyTransfers < 3) {
    setTimeout(() => {
      dailyTransfers++;
      res.json({ success: true, transferNumber: dailyTransfers, flag: dailyTransfers > 3 ? 'FLAG{race_condition_won}' : undefined });
    }, 50);
  } else {
    res.json({ success: false, message: 'Daily limit reached (3 transfers)' });
  }
});

module.exports = router;
