const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['elderly_assistance', 'maintenance', 'cleanliness', 'safety', 'other'], default: 'other' },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'rejected'], default: 'open' },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  imageUrl: { type: String },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rewardPoints: { type: Number, default: 0 },  // AI calculated
  aiConfidenceScore: { type: Number },          // spam detection score
  isSpam: { type: Boolean, default: false },
  completionImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', IssueSchema);