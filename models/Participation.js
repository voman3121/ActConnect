const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  status: { type: String, enum: ['joined', 'completed', 'verified', 'rejected'], default: 'joined' },
  completionNote: { type: String },
  completionImageUrl: { type: String },
  pointsAwarded: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Participation', ParticipationSchema);