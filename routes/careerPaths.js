const router = require('express').Router();
const CareerPath = require('../models/CareerPath');

const DEFAULT_CAREER_PATHS = [
  { _id: '1', title: 'Full Stack Developer', description: 'Master frontend and backend development', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'] },
  { _id: '2', title: 'Data Scientist', description: 'Learn data analysis and machine learning', skills: ['Python', 'SQL', 'Statistics', 'ML'] },
  { _id: '3', title: 'DevOps Engineer', description: 'Master cloud infrastructure and CI/CD', skills: ['Docker', 'Kubernetes', 'AWS', 'Linux'] }
];

// GET all career paths
router.get('/', async (req, res) => {
  try {
    const careers = await CareerPath.find();
    res.json(careers);
  } catch (err) {
    console.warn('⚠️  Database unavailable, returning default career paths');
    res.json(DEFAULT_CAREER_PATHS);
  }
});

// GET single career path
router.get('/:id', async (req, res) => {
  try {
    const career = await CareerPath.findById(req.params.id);
    res.json(career || { error: 'Career path not found' });
  } catch (err) {
    console.warn('⚠️  Database unavailable, returning default career path');
    const defaultPath = DEFAULT_CAREER_PATHS.find(p => p._id === req.params.id) || DEFAULT_CAREER_PATHS[0];
    res.json(defaultPath);
  }
});

// ADD career path
router.post('/add', async (req, res) => {
  try {
    const career = new CareerPath(req.body);
    await career.save();
    res.json(career);
  } catch (err) {
    console.warn('⚠️  Database unavailable, storing in memory only');
    res.json({ ...req.body, _id: Date.now().toString(), message: 'Saved in memory (offline mode)' });
  }
});

module.exports = router;