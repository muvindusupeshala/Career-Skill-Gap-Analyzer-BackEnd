const mongoose = require('mongoose');

const AiRecommendationBundleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  overview: { type: String, default: '' },
  careers: [{
    careerTitle: { type: String },
    matchScore: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    prioritySkills: [{ type: String }],
  }],
  resources: [{
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningResource' },
    title: { type: String },
    skill: { type: String },
    provider: { type: String },
    url: { type: String },
    reason: { type: String, default: '' },
  }],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AiRecommendationBundle', AiRecommendationBundleSchema);
