const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const AiChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [MessageSchema],
  lastBundleAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('AiChatSession', AiChatSessionSchema);
