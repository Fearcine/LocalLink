const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ parentGroup: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/grouped', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    const grouped = categories.reduce((acc, cat) => {
      if (!acc[cat.parentGroup]) acc[cat.parentGroup] = [];
      acc[cat.parentGroup].push(cat);
      return acc;
    }, {});
    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
