const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const protect = require('../middleware/auth');

// CV Upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/cvs';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `cv_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, regNo, email, phone, year, stream, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { regNo }] });
    if (exists) return res.status(400).json({ message: 'Email or Reg No already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, regNo, email, phone, year, stream, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name, regNo, email, year } });
  } catch (err) {
    console.log('❌ Register Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, regNo: user.regNo, email: user.email, year: user.year } });
  } catch (err) {
    console.log('❌ Login Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// UPLOAD CV
router.post('/upload-cv', protect, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const cvPath = req.file.path;
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(cvPath);
    const pdfData = await pdfParse(dataBuffer);
    const cvText = pdfData.text.toLowerCase();

    const skillKeywords = {
      'JavaScript / TypeScript': ['javascript', 'typescript', 'js', 'ts'],
      'Python': ['python'],
      'React / Angular / Vue': ['react', 'angular', 'vue'],
      'Node.js / Backend Dev': ['node.js', 'nodejs', 'express'],
      'SQL / Databases': ['sql', 'mysql', 'postgresql', 'mongodb', 'database'],
      'Data Analysis': ['data analysis', 'pandas', 'numpy', 'excel'],
      'Machine Learning / AI': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'ai'],
      'Cloud Platforms (AWS/Azure/GCP)': ['aws', 'azure', 'gcp', 'cloud'],
      'Docker & Kubernetes': ['docker', 'kubernetes', 'container'],
      'CI/CD Pipelines': ['ci/cd', 'jenkins', 'github actions', 'devops'],
      'Linux / System Admin': ['linux', 'ubuntu', 'bash', 'shell'],
      'Data Visualization': ['tableau', 'power bi', 'matplotlib', 'visualization'],
      'Statistics & Probability': ['statistics', 'probability', 'r language'],
      'Problem Solving': ['problem solving', 'algorithms', 'data structures'],
      'Communication': ['communication', 'presentation', 'public speaking'],
      'Teamwork & Collaboration': ['teamwork', 'collaboration', 'agile', 'scrum'],
      'Time Management': ['time management', 'deadline', 'organized'],
      'Leadership': ['leadership', 'team lead', 'manager', 'mentor'],
    };

    const detectedSkills = {};
    Object.entries(skillKeywords).forEach(([skill, keywords]) => {
      const found = keywords.some(kw => cvText.includes(kw));
      if (found) detectedSkills[skill] = 2;
    });

    await User.findByIdAndUpdate(req.user.id, {
      cvPath,
      cvSkills: Object.keys(detectedSkills)
    });

    res.json({
      message: 'CV uploaded and skills extracted successfully',
      detectedSkills,
      skillCount: Object.keys(detectedSkills).length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;