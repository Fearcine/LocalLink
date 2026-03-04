const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const freelancerCtrl = require('../controllers/freelancerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload    = require('../middleware/upload');

// ─── Rate limiters ────────────────────────────────────────────────────────────

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again later.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: { success: false, message: 'Too many OTP attempts. Try again later.' },
});

// ─── Validators ───────────────────────────────────────────────────────────────

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('phone')
    .trim().notEmpty().withMessage('Phone is required.')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid phone number.'),
  body('primaryCategory').notEmpty().withMessage('Primary category is required.'),
  body('priceAmount')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('priceModel')
    .optional()
    .isIn(['hourly', 'daily', 'per_job']).withMessage('Invalid price model.'),
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience must be 0–50 years.'),
  body('serviceRadius')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Service radius must be 1–50 km.'),
];

const validateOtpVerify = [
  body('phone')
    .trim().notEmpty().withMessage('Phone is required.')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid phone number.'),
  body('otp')
    .trim().notEmpty().withMessage('OTP is required.')
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

// ─── Public routes ────────────────────────────────────────────────────────────

/** GET /api/freelancers/search */
router.get('/search', freelancerCtrl.search);

/** GET /api/freelancers/top */
router.get('/top', freelancerCtrl.getTopFreelancers);

/**
 * POST /api/freelancers/register
 * Multipart form — accepts profilePhoto + idProof files.
 */
router.post(
  '/register',
  registerLimiter,
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idProof',      maxCount: 1 },
  ]),
  validateRegister,
  validate,
  freelancerCtrl.register
);

/**
 * POST /api/freelancers/verify-otp
 * Called after register to confirm phone ownership.
 */
router.post(
  '/verify-otp',
  verifyLimiter,
  validateOtpVerify,
  validate,
  freelancerCtrl.verifyOtp
);

/** GET /api/freelancers/:id/contact — requires login */
router.get('/:id/contact', protect, freelancerCtrl.getContact);

/** GET /api/freelancers/:id — public profile */
router.get('/:id', freelancerCtrl.getProfile);

// ─── Authenticated freelancer routes ─────────────────────────────────────────

/** GET /api/freelancers/my-profile */
router.get(
  '/my-profile',
  protect,
  authorize('freelancer'),
  freelancerCtrl.getMyProfile
);

/** PUT /api/freelancers/my-profile */
router.put(
  '/my-profile',
  protect,
  authorize('freelancer'),
  freelancerCtrl.updateProfile
);

module.exports = router;
