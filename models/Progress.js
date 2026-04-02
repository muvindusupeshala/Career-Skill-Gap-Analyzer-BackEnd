const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:       { type: String },
  overall:     { type: Number },
  programming: { type: Number },
  data:        { type: Number },
  infra:       { type: Number },
  softSkills:  { type: Number },
  notes:       { type: String },
  dateUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Progress', ProgressSchema);