
/**
 * authController.js
 *
 * Handles OTP-based authentication for Users and Admins.
 * Freelancer OTP flow lives in freelancerController.js.
 *
 * Endpoints:
 *   POST /auth/send-otp    — generate OTP, hash it, send via Twilio
 *   POST /auth/verify-otp  — validate OTP, return JWT
 *   GET  /auth/me          — return current authenticated user
 */

const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const Otp        = require('../models/Otp');
const { generateOtp, sendOtp } = require('../services/otpService');

// ─── Config constants ─────────────────────────────────────────────────────────

const OTP_TTL_MS       = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS     = 5;
const SEND_COOLDOWN_MS = 60 * 1000;     // minimum gap between resend requests

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Sign a JWT for a given user ID.
 */
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /auth/send-otp ──────────────────────────────────────────────────────

/**
 * @desc    Generate a 6-digit OTP, hash it, persist it, and send via Twilio.
 * @route   POST /api/auth/send-otp
 * @access  Public
 * @body    { phone: string }  — E.164 format, e.g. "+919876543210"
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    // ── Resend cooldown ──────────────────────────────────────────────────────
    // Prevent the same phone from hammering the SMS gateway.
    // (Route-level rate limiting by IP is handled in authRoutes.js.)
    const existing = await Otp.findOne({ phone });

    if (existing && existing.lastSentAt) {
      const elapsed = Date.now() - existing.lastSentAt.getTime();
      if (elapsed < SEND_COOLDOWN_MS) {
        const wait = Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${wait} second${wait !== 1 ? 's' : ''} before requesting another OTP.`,
        });
      }
    }

    // ── Generate, hash, persist ──────────────────────────────────────────────
    const code      = generateOtp();
    const otpHash   = await Otp.hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.findOneAndUpdate(
      { phone },
      {
        otpHash,
        expiresAt,
        attempts:    0,         // reset attempt counter on fresh OTP
        lastSentAt:  new Date(), // used for resend cooldown above
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Dispatch via Twilio ──────────────────────────────────────────────────
    // If Twilio throws, the error propagates to the global error handler.
    // The OTP record is persisted even if SMS fails — this is intentional so
    // that callers can retry dispatch without generating a new code.
    await sendOtp(phone, code);

    return res.json({
      success: true,
      message: 'OTP sent successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────

/**
 * @desc    Verify submitted OTP. On success, return JWT and user payload.
 *          Auto-creates a User record (role: "user") on first login.
 * @route   POST /api/auth/verify-otp
 * @access  Public
 * @body    { phone: string, otp: string }
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required.',
      });
    }

    // ── Locate OTP record ────────────────────────────────────────────────────
    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this number. Please request one first.',
      });
    }

    // ── Expiry check ─────────────────────────────────────────────────────────
    if (otpRecord.isExpired()) {
      await Otp.deleteOne({ phone }); // clean up expired record
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // ── Attempt-limit check ──────────────────────────────────────────────────
    if (otpRecord.isLocked()) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    // ── Verify hash ──────────────────────────────────────────────────────────
    const valid = await otpRecord.verifyOtp(otp);

    if (!valid) {
      // Increment attempt counter atomically
      await Otp.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } });

      const remaining = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // ── OTP valid — consume it ───────────────────────────────────────────────
    await Otp.deleteOne({ phone });

    // ── Find or auto-create user ─────────────────────────────────────────────
    // Normal users are created automatically on first login — no separate
    // registration step. Admins must already exist in the database.
    let user  = await User.findOne({ phone });
    let isNew = false;

    if (!user) {
      user  = await User.create({ phone, role: 'user' });
      isNew = true;
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:    user._id,
        phone: user.phone,
        name:  user.name,
        role:  user.role,
        isNew,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

/**
 * @desc    Return the currently authenticated user's profile.
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT)
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};