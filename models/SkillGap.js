const mongoose = require('mongoose');

const SkillGapSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetCareer:   { type: String, required: true },
  readinessScore: { type: Number },
  gaps: [{
    skill:         { type: String },
    currentLevel:  { type: Number },
    requiredLevel: { type: Number },
    gap:           { type: Number },
  }],
}, { timestamps: true });

module.exports = mongoose.model('SkillGap', SkillGapSchema);