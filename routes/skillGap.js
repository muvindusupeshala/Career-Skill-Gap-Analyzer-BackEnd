const router = require('express').Router();
const protect = require('../middleware/auth');
const SkillGap = require('../models/SkillGap');
const Assessment = require('../models/Assessment');

const normalizeSkills = (skills) => {
  if (!skills) return {};
  if (skills instanceof Map) return Object.fromEntries(skills);
  if (typeof skills.toObject === 'function') return skills.toObject();
  return skills;
};

// GENERATE & SAVE skill gap
router.post('/generate', protect, async (req, res) => {
  try {
    const CareerPath = require('../models/CareerPath');
    const { targetCareer } = req.body;
    const assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) return res.status(404).json({ message: 'No assessment found' });

    const userSkills = normalizeSkills(assessment.skills);
    const careerPath = await CareerPath.findOne({ title: targetCareer });
    if (!careerPath) return res.status(400).json({ message: 'Invalid career' });

    const required = (careerPath.requiredSkills || []).reduce((acc, item) => {
      if (item?.skillName) acc[item.skillName] = item.requiredLevel || 0;
      return acc;
    }, {});

    const requiredEntries = Object.entries(required);
    const gaps = requiredEntries.map(([skill, reqLevel]) => ({
      skill,
      currentLevel:  userSkills[skill] || 0,
      requiredLevel: reqLevel,
      gap:           Math.max(0, reqLevel - (userSkills[skill] || 0)),
    }));

    const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);
    const divisor = Math.max(requiredEntries.length * 4, 1);
    const readinessScore = Math.max(0, Math.round(100 - (totalGap / divisor) * 100));

    const existing = await SkillGap.findOne({ userId: req.user.id, targetCareer });
    if (existing) {
      const updated = await SkillGap.findByIdAndUpdate(existing._id, { gaps, readinessScore }, { new: true });
      return res.json(updated);
    }

    const skillGap = new SkillGap({ userId: req.user.id, targetCareer, gaps, readinessScore });
    await skillGap.save();
    res.json(skillGap);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my skill gaps
router.get('/me', protect, async (req, res) => {
  try {
    const gaps = await SkillGap.find({ userId: req.user.id });
    res.json(gaps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;