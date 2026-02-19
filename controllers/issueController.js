const Issue = require('../models/Issue');
const Participation = require('../models/Participation');
const User = require('../models/User');
const { detectSpam, categorizeIssue, estimateReward, verifyCompletion } = require('../services/aiService');

// POST /api/issues — Report a new issue
exports.createIssue = async (req, res) => {
  try {
    const { title, description, location } = req.body;

    // Step 1: Spam check
    const spamResult = await detectSpam(title, description);
    if (spamResult.isSpam) {
      return res.status(400).json({ message: 'Issue flagged as spam', reason: spamResult.reason });
    }

    // Step 2: Categorize
    const { category, urgency } = await categorizeIssue(title, description);

    // Step 3: Estimate reward
    const { rewardPoints } = await estimateReward(category, urgency, description);

    const issue = await Issue.create({
      title, description, location,
      reportedBy: req.user.id,
      category, urgency, rewardPoints,
      aiConfidenceScore: spamResult.confidenceScore,
      isSpam: false
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/issues — Get all open issues
exports.getIssues = async (req, res) => {
  try {
    const { category, urgency, status } = req.query;
    const filter = { isSpam: false };
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;
    else filter.status = 'open';

    const issues = await Issue.find(filter).populate('reportedBy', 'name').sort('-createdAt');
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/issues/:id
exports.getIssueById = async (req, res) => {
  const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name').populate('assignedTo', 'name');
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json(issue);
};

// POST /api/issues/:id/join — Volunteer joins a task
exports.joinIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue || issue.status !== 'open') return res.status(400).json({ message: 'Issue not available' });

    const already = await Participation.findOne({ volunteer: req.user.id, issue: issue._id });
    if (already) return res.status(400).json({ message: 'Already joined' });

    await Participation.create({ volunteer: req.user.id, issue: issue._id });
    issue.status = 'in_progress';
    issue.assignedTo = req.user.id;
    await issue.save();

    res.json({ message: 'Joined successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/issues/:id/complete — Volunteer submits completion
exports.completeIssue = async (req, res) => {
  try {
    const { completionNote } = req.body;
    const participation = await Participation.findOne({ volunteer: req.user.id, issue: req.params.id });
    if (!participation) return res.status(404).json({ message: 'Participation not found' });

    const issue = await Issue.findById(req.params.id);

    // AI verification
    const verification = await verifyCompletion(issue.description, completionNote);

    participation.completionNote = completionNote;
    participation.status = verification.isVerified ? 'verified' : 'rejected';
    participation.completedAt = new Date();

    if (verification.isVerified) {
      participation.pointsAwarded = issue.rewardPoints;
      issue.status = 'completed';

      // Credit ActCoins to volunteer
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { actCoinBalance: issue.rewardPoints, totalEarned: issue.rewardPoints }
      });
    }

    await participation.save();
    await issue.save();

    res.json({
      message: verification.isVerified ? 'Completion verified! Coins awarded.' : 'Completion rejected by AI.',
      pointsAwarded: participation.pointsAwarded,
      reason: verification.reason
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};