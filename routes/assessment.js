const router = require('express').Router();
const protect = require('../middleware/auth');
const Assessment = require('../models/Assessment');

// SAVE assessment
router.post('/save', protect, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    const existing = await Assessment.findOne({ userId: req.user.id });

    if (existing) {
      const updated = await Assessment.findByIdAndUpdate(existing._id, data, { new: true });
      return res.json(updated);
    }

    const assessment = new Assessment(data);
    await assessment.save();
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my assessment
router.get('/me', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ userId: req.user.id });
    res.json(assessment || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


const multer = require('multer');
const pdfParse = require('pdf-parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const SKILL_KEYWORDS = {
  'JavaScript / TypeScript': ['javascript', 'js', 'typescript', 'ts', 'node.js', 'react'],
  'Python': ['python', 'django', 'flask', 'fastapi'],
  'Java / Kotlin': ['java', 'spring', 'kotlin', 'android'],
  'React / Angular / Vue': ['react', 'angular', 'vue', 'frontend'],
  'Node.js / Backend Dev': ['node.js', 'node', 'express', 'backend', 'api'],
  'SQL / Databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'database', 'nosql'],
  'Data Analysis': ['data analysis', 'pandas', 'numpy', 'excel', 'tableau', 'powerbi'],
  'Machine Learning / AI': ['machine learning', 'ai', 'tensorflow', 'keras', 'pytorch'],
  'Data Visualization': ['visualization', 'tableau', 'power bi', 'matplotlib'],
  'Statistics & Probability': ['statistics', 'probability', 'math'],
  'Cloud Platforms (AWS/Azure/GCP)': ['aws', 'azure', 'gcp', 'cloud'],
  'Docker & Kubernetes': ['docker', 'kubernetes', 'k8s', 'container'],
  'CI/CD Pipelines': ['ci/cd', 'jenkins', 'github actions', 'gitlab ci'],
  'Linux / System Admin': ['linux', 'ubuntu', 'bash', 'shell', 'unix'],
  'Problem Solving': ['problem solving', 'algorithm', 'data structures'],
  'Communication': ['communication', 'presentation', 'writing'],
  'Teamwork & Collaboration': ['teamwork', 'collaboration', 'agile', 'scrum'],
  'Time Management': ['time management', 'organization', 'planning'],
  'Leadership': ['leadership', 'management', 'mentoring', 'lead']
};

router.post('/upload-cv', protect, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text.toLowerCase();
    } else {
      text = req.file.buffer.toString('utf-8').toLowerCase();
    }
    const matchedSkills = {};
    for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) { matchedSkills[skill] = 2; break; }
      }
    }
    res.json({ skills: matchedSkills });
  } catch (err) {
    console.error('Backend CV error:', err); res.status(500).json({ message: 'Error processing CV: ' + err.message });
  }
});

module.exports = router;
