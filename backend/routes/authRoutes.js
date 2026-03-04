const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authCtrl   = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ─── Rate limiters ────────────────────────────────────────────────────────────

// 5 send-OTP requests per 15 minutes per IP
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: { success: false, message: 'Too many OTP requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 10 verify attempts per 15 minutes per IP
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: { success: false, message: 'Too many verify attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validators ───────────────────────────────────────────────────────────────

const validatePhone = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid phone number format.'),
];

const validateOtp = [
  ...validatePhone,
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must contain only digits.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Body: { phone: "+919876543210" }
 */
router.post('/send-otp', sendOtpLimiter, validatePhone, validate, authCtrl.sendOtp);

/**
 * POST /api/auth/verify-otp
 * Body: { phone, otp }
 * Returns: { token, user }
 */
router.post('/verify-otp', verifyOtpLimiter, validateOtp, validate, authCtrl.verifyOtp);

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
router.get('/me', protect, authCtrl.getMe);

module.exports = router;
