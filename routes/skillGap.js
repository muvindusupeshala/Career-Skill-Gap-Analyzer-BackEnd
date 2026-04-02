const router = require('express').Router();
const protect = require('../middleware/auth');
const SkillGap = require('../models/SkillGap');
const Assessment = require('../models/Assessment');

const careerRequirements = {
  'Software Engineer':    { 'JavaScript / TypeScript': 3, 'React / Angular / Vue': 3, 'Node.js / Backend Dev': 3, 'SQL / Databases': 2, 'Problem Solving': 4 },
  'Data Analyst':         { 'Python': 3, 'SQL / Databases': 4, 'Data Analysis': 4, 'Statistics & Probability': 3 },
  'ML/AI Engineer':       { 'Python': 4, 'Machine Learning / AI': 4, 'Data Analysis': 3, 'Statistics & Probability': 4 },
  'DevOps Engineer':      { 'Cloud Platforms (AWS/Azure/GCP)': 4, 'Docker & Kubernetes': 4, 'CI/CD Pipelines': 4, 'Linux / System Admin': 3 },
  'Full Stack Developer': { 'JavaScript / TypeScript': 4, 'React / Angular / Vue': 3, 'Node.js / Backend Dev': 3, 'SQL / Databases': 3 },
};

// GENERATE & SAVE skill gap
router.post('/generate', protect, async (req, res) => {
  try {
    const { targetCareer } = req.body;
    const assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) return res.status(404).json({ message: 'No assessment found' });

    const userSkills = Object.fromEntries(assessment.skills);
    const required = careerRequirements[targetCareer];
    if (!required) return res.status(400).json({ message: 'Invalid career' });

    const gaps = Object.entries(required).map(([skill, reqLevel]) => ({
      skill,
      currentLevel:  userSkills[skill] || 0,
      requiredLevel: reqLevel,
      gap:           Math.max(0, reqLevel - (userSkills[skill] || 0)),
    }));

    const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);
    const readinessScore = Math.max(0, Math.round(100 - (totalGap / (Object.keys(required).length * 4)) * 100));

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