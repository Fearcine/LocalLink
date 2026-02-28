const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Update profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, email, location } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, location },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
