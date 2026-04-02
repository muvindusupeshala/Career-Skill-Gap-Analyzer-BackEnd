const router = require('express').Router();
const Skill = require('../models/Skill');
const protect = require('../middleware/auth');

// GET all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD new skill
router.post('/add', protect, async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;