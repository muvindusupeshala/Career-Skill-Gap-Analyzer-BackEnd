const router = require('express').Router();
const CareerPath = require('../models/CareerPath');

// GET all career paths
router.get('/', async (req, res) => {
  try {
    const careers = await CareerPath.find();
    res.json(careers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single career path
router.get('/:id', async (req, res) => {
  try {
    const career = await CareerPath.findById(req.params.id);
    res.json(career);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD career path
router.post('/add', async (req, res) => {
  try {
    const career = new CareerPath(req.body);
    await career.save();
    res.json(career);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;