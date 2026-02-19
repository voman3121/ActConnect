const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWallet, getHistory, redeemCoins } = require('../controllers/rewardController');

router.get('/wallet', protect, getWallet);
router.get('/history', protect, getHistory);
router.post('/redeem', protect, redeemCoins);

module.exports = router;