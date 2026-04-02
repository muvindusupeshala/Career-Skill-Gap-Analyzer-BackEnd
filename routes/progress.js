const router = require('express').Router();
const protect = require('../middleware/auth');
const Progress = require('../models/Progress');

// SAVE progress
router.post('/save', protect, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    const progress = new Progress(data);
    await progress.save();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all my progress history
router.get('/me', protect, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE progress entry
router.put('/:id', protect, async (req, res) => {
  try {
    const updated = await Progress.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;