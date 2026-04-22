const mongoose = require('mongoose');

const LearningResourceSchema = new mongoose.Schema({
  skill:             { type: String, required: true },
  title:             { type: String, required: true },
  provider:          { type: String },
  type:              { type: String, enum: ['Course', 'Video', 'Certificate', 'Article'] },
  duration:          { type: String },
  rating:            { type: Number },
  free:              { type: Boolean, default: false },
  url:               { type: String },
  estimatedDuration: { type: String },
  description:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LearningResource', LearningResourceSchema);