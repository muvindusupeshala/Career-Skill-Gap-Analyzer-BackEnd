const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  regNo:         { type: String, required: true, unique: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String },
  year:          { type: String, default: '3rd Year' },
  stream:        { type: String },
  password:      { type: String, required: true },
  cvPath:        { type: String },
  cvSkills:      [String],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);