const mongoose = require('mongoose');

const CareerRecommendationSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  recommendations: [{
    careerTitle: { type: String },
    matchScore:  { type: Number },
    rank:        { type: Number },
  }],
  topCareer:   { type: String },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('CareerRecommendation', CareerRecommendationSchema);