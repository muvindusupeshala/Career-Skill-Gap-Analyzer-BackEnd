const router = require('express').Router();
const fsp = require('fs/promises');
const path = require('path');
const protect = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { generateJson } = require('../services/aiStudio');

const pct = (skills, keys) => {
  if (!skills || keys.length === 0) return 0;
  const total = keys.reduce((sum, key) => sum + Number(skills[key] || 0), 0);
  const avg = total / keys.length;
  return Math.round((avg / 4) * 100);
};

const monthLabel = () => new Date().toLocaleString('default', { month: 'short' });

const createProgressSnapshot = async (userId, payload) => {
  const skills = payload.skills || {};
  const row = {
    userId,
    month: monthLabel(),
    overall: Number(payload.overallScore || 0),
    programming: pct(skills, ['JavaScript / TypeScript', 'Python', 'React / Angular / Vue', 'Node.js / Backend Dev', 'SQL / Databases']),
    data: pct(skills, ['Data Analysis', 'Machine Learning / AI', 'Data Visualization', 'Statistics & Probability']),
    infra: pct(skills, ['Cloud Platforms (AWS/Azure/GCP)', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Linux / System Admin']),
    softSkills: pct(skills, ['Problem Solving', 'Communication', 'Teamwork & Collaboration', 'Time Management', 'Leadership']),
    notes: `Auto snapshot (${payload.source || 'assessment'})`,
  };

  await Progress.create(row);
};

// SAVE assessment
router.post('/save', protect, async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    const existing = await Assessment.findOne({ userId: req.user.id });
    let output;

    if (existing) {
      output = await Assessment.findByIdAndUpdate(existing._id, data, { new: true });
    } else {
      const assessment = new Assessment(data);
      output = await assessment.save();
    }

    await createProgressSnapshot(req.user.id, data);
    res.json(output);
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
const { PDFParse } = require('pdf-parse');

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return String(result?.text || '');
  } finally {
    await parser.destroy();
  }
};

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

const skillCatalog = Object.keys(SKILL_KEYWORDS);

const sanitizeFileName = (name) => String(name || 'cv')
  .replace(/[^a-zA-Z0-9._-]/g, '_')
  .replace(/_+/g, '_')
  .slice(0, 80);

const ensureCvUploadDir = async () => {
  const dir = path.join(__dirname, '..', 'uploads', 'cvs');
  await fsp.mkdir(dir, { recursive: true });
  return dir;
};

const saveCvToProject = async (file, userId) => {
  const dir = await ensureCvUploadDir();
  const ext = path.extname(file.originalname || '') || (file.mimetype === 'application/pdf' ? '.pdf' : '.txt');
  const safeBase = path.basename(sanitizeFileName(file.originalname || 'cv'), path.extname(file.originalname || ''));
  const filename = `${safeBase}_${String(userId)}_${Date.now()}${ext}`;
  const diskPath = path.join(dir, filename);
  await fsp.writeFile(diskPath, file.buffer);
  return {
    diskPath,
    publicPath: `/uploads/cvs/${filename}`,
  };
};

const extractKeywordSkills = (text) => {
  const matchedSkills = {};
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matchedSkills[skill] = 2;
        break;
      }
    }
  }
  return matchedSkills;
};

const extractAiSkills = async (text, fallbackSkills) => {
  const snippet = String(text || '').slice(0, 12000);
  if (!snippet.trim()) return fallbackSkills;

  const fallback = {
    skills: Object.entries(fallbackSkills).map(([name, level]) => ({ name, level })),
  };

  const ai = await generateJson({
    systemPrompt: [
      'You extract technical and soft skills from CV text for an IT student profile.',
      'Use only the provided skill catalog.',
      'Return valid JSON only.',
    ].join(' '),
    userPrompt: `Skill catalog: ${JSON.stringify(skillCatalog)}\nCV text:\n${snippet}\nReturn JSON with shape: {"skills":[{"name":"catalog skill","level":0-4}]}. Include only detected skills.`,
    fallback,
  });

  const extracted = {};
  const rows = Array.isArray(ai?.skills) ? ai.skills : [];
  rows.forEach((row) => {
    const name = String(row?.name || '').trim();
    if (!skillCatalog.includes(name)) return;
    const rawLevel = Number(row?.level);
    const level = Number.isFinite(rawLevel) ? Math.max(1, Math.min(4, Math.round(rawLevel))) : 2;
    extracted[name] = level;
  });

  return {
    ...fallbackSkills,
    ...extracted,
  };
};

router.post('/upload-cv', protect, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { diskPath, publicPath } = await saveCvToProject(req.file, req.user.id);

    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      text = (await extractPdfText(req.file.buffer)).toLowerCase();
    } else {
      text = req.file.buffer.toString('utf-8').toLowerCase();
    }

    const keywordSkills = extractKeywordSkills(text);
    const aiSkills = await extractAiSkills(text, keywordSkills);

    await User.findByIdAndUpdate(req.user.id, {
      cvPath: publicPath,
      cvSkills: Object.keys(aiSkills),
    });

    res.json({
      message: 'CV uploaded and analyzed successfully',
      skills: aiSkills,
      cvPath: publicPath,
      storedAt: diskPath,
      detectedCount: Object.keys(aiSkills).length,
    });
  } catch (err) {
    console.error('Backend CV error:', err);
    res.status(500).json({ message: 'Error processing CV: ' + err.message });
  }
});

module.exports = router;
