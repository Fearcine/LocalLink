const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, completeProfile, getMe, adminLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.put('/complete-profile', protect, completeProfile);
router.get('/me', protect, getMe);
router.post('/admin-login', adminLogin);

module.exports = router;
