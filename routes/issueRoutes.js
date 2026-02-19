const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createIssue, getIssues, getIssueById, joinIssue, completeIssue } = require('../controllers/issueController');

router.get('/', protect, getIssues);
router.post('/', protect, createIssue);
router.get('/:id', protect, getIssueById);
router.post('/:id/join', protect, joinIssue);
router.post('/:id/complete', protect, completeIssue);

module.exports = router;