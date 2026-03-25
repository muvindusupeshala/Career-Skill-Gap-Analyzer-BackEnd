const router = require('express').Router();
const protect = require('../middleware/auth');
const CareerRecommendation = require('../models/CareerRecommendation');
const Assessment = require('../models/Assessment');

const careerRequirements = {
  'Software Engineer':    { 'JavaScript / TypeScript': 3, 'React / Angular / Vue': 3, 'Node.js / Backend Dev': 3, 'SQL / Databases': 2, 'Problem Solving': 4 },
  'Data Analyst':         { 'Python': 3, 'SQL / Databases': 4, 'Data Analysis': 4, 'Statistics & Probability': 3, 'Data Visualization': 3 },
  'ML/AI Engineer':       { 'Python': 4, 'Machine Learning / AI': 4, 'Data Analysis': 3, 'Statistics & Probability': 4, 'SQL / Databases': 2 },
  'DevOps Engineer':      { 'Cloud Platforms (AWS/Azure/GCP)': 4, 'Docker & Kubernetes': 4, 'CI/CD Pipelines': 4, 'Linux / System Admin': 3 },
  'Full Stack Developer': { 'JavaScript / TypeScript': 4, 'React / Angular / Vue': 3, 'Node.js / Backend Dev': 3, 'SQL / Databases': 3 },
};

// Calculate match score
const calcScore = (userSkills, required) => {
  const keys = Object.keys(required);
  const total = keys.reduce((sum, skill) => {
    const userLevel = userSkills[skill] || 0;
    const reqLevel = required[skill];
    return sum + Math.min(userLevel / reqLevel, 1);
  }, 0);
  return Math.round((total / keys.length) * 100);
};

// GENERATE & SAVE recommendation
router.post('/generate', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ userId: req.user.id });
    if (!assessment) return res.status(404).json({ message: 'No assessment found. Complete the chatbot first.' });

    const userSkills = Object.fromEntries(assessment.skills);

    const recommendations = Object.entries(careerRequirements)
      .map(([title, required]) => ({
        careerTitle: title,
        matchScore:  calcScore(userSkills, required),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((rec, i) => ({ ...rec, rank: i + 1 }));

    const topCareer = recommendations[0].careerTitle;

    const existing = await CareerRecommendation.findOne({ userId: req.user.id });
    if (existing) {
      const updated = await CareerRecommendation.findByIdAndUpdate(
        existing._id,
        { recommendations, topCareer, assessmentId: assessment._id, generatedAt: new Date() },
        { new: true }
      );
      return res.json(updated);
    }

    const recommendation = new CareerRecommendation({
      userId:       req.user.id,
      assessmentId: assessment._id,
      recommendations,
      topCareer,
    });
    await recommendation.save();
    res.json(recommendation);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my recommendations
router.get('/me', protect, async (req, res) => {
  try {
    const recommendation = await CareerRecommendation.findOne({ userId: req.user.id });
    res.json(recommendation || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;