const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  skillId:     { type: String, required: true, unique: true },
  skillName:   { type: String, required: true },
  skillType:   { type: String, enum: ['technical', 'soft'] },
  category:    { type: String },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Skill', SkillSchema);
