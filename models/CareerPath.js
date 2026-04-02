const mongoose = require('mongoose');

const CareerPathSchema = new mongoose.Schema({
  title:              { type: String, required: true },
  description:        { type: String },
  typicalSalaryRange: { type: String },
  demand:             { type: String },
  growth:             { type: String },
  requiredSkills: [{
    skillName:        { type: String },
    requiredLevel:    { type: Number, min: 0, max: 4 },
    importanceWeight: { type: Number, min: 1, max: 5 },
  }],
}, { timestamps: true });

module.exports = mongoose.model('CareerPath', CareerPathSchema);