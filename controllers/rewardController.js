const User = require('../models/User');
const Participation = require('../models/Participation');

// GET /api/rewards/wallet
exports.getWallet = async (req, res) => {
  const user = await User.findById(req.user.id).select('name actCoinBalance totalEarned');
  res.json(user);
};

// GET /api/rewards/history
exports.getHistory = async (req, res) => {
  const history = await Participation.find({ volunteer: req.user.id, status: 'verified' })
    .populate('issue', 'title category rewardPoints')
    .sort('-completedAt');
  res.json(history);
};

// POST /api/rewards/redeem
exports.redeemCoins = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (user.actCoinBalance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    user.actCoinBalance -= amount;
    await user.save();

    res.json({ message: `${amount} ActCoins redeemed successfully`, newBalance: user.actCoinBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};