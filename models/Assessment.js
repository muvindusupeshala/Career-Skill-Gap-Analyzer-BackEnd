const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skills:       { type: Map, of: Number },
  overallScore: { type: Number },
  gpa:          { type: String },
  quals:        { type: String },
  source:       { type: String, enum: ['chatbot', 'manual', 'cv'], default: 'chatbot' },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);