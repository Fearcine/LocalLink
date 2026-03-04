/**
 * authController.js
 * Handles OTP send/verify for normal users and admins.
 * Freelancer registration OTP is in freelancerController.js.
 */

const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const User      = require('../models/User');
const Otp       = require('../models/Otp');

// ─── helpers ──────────────────────────────────────────────────────────────────

const OTP_TTL_MS       = 5 * 60 * 1000;   // 5 minutes
const MAX_ATTEMPTS     = 5;
const SEND_COOLDOWN_MS = 60 * 1000;       // 1 minute between sends
const SEND_WINDOW_MS   = 60 * 60 * 1000; // 1 hour window
const MAX_SENDS        = 5;              // max OTPs per hour per phone

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generate a 6-digit OTP.
 * Uses crypto.randomInt for cryptographic randomness.
 */
const generateOtp = () =>
  String(crypto.randomInt(100000, 999999));

/**
 * Send (or mock-send) the OTP.
 * DEV_OTP=true → print to console only.
 */
const dispatchOtp = async (phone, code) => {
  if (process.env.DEV_OTP === 'true') {
    console.log(`\n🔑  [DEV OTP]  Phone: ${phone}  |  Code: ${code}\n`);
    return;
  }
  // Production: plug in Twilio / AWS SNS here
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await twilio.messages.create({ body: `Your LocalLink code: ${code}`, from: process.env.TWILIO_FROM, to: phone });
  throw new Error('SMS provider not configured. Set DEV_OTP=true for development.');
};

// ─── POST /auth/send-otp ──────────────────────────────────────────────────────

exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

    const now = Date.now();

    // Find existing OTP record for rate-limit checks
    let otpRecord = await Otp.findOne({ phone });

    if (otpRecord) {
      // Enforce cooldown between consecutive sends
      if (
        otpRecord.lastSentAt &&
        now - otpRecord.lastSentAt.getTime() < SEND_COOLDOWN_MS
      ) {
        const wait = Math.ceil((SEND_COOLDOWN_MS - (now - otpRecord.lastSentAt.getTime())) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${wait}s before requesting another OTP.`,
        });
      }

      // Enforce hourly send cap
      const windowStart = otpRecord.sendWindowStart
        ? otpRecord.sendWindowStart.getTime()
        : 0;
      const inWindow = now - windowStart < SEND_WINDOW_MS;
      if (inWindow && otpRecord.sendCount >= MAX_SENDS) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Try again in an hour.',
        });
      }
    }

    // Generate & hash OTP
    const code    = generateOtp();
    const otpHash = await Otp.hashOtp(code);
    const expiresAt = new Date(now + OTP_TTL_MS);

    // Compute new send window / count
    let sendCount       = 1;
    let sendWindowStart = new Date(now);
    if (otpRecord && otpRecord.sendWindowStart) {
      const inWindow =
        now - otpRecord.sendWindowStart.getTime() < SEND_WINDOW_MS;
      sendCount       = inWindow ? otpRecord.sendCount + 1 : 1;
      sendWindowStart = inWindow ? otpRecord.sendWindowStart : new Date(now);
    }

    // Upsert OTP record
    await Otp.findOneAndUpdate(
      { phone },
      {
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(now),
        sendCount,
        sendWindowStart,
      },
      { upsert: true, new: true }
    );

    await dispatchOtp(phone, code);

    return res.json({
      success: true,
      message:
        process.env.DEV_OTP === 'true'
          ? 'OTP printed to server console (DEV mode).'
          : 'OTP sent successfully.',
      dev: process.env.DEV_OTP === 'true' ? { code } : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });

    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord)
      return res.status(400).json({ success: false, message: 'No OTP found. Please request one first.' });

    if (new Date() > otpRecord.expiresAt)
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    if (otpRecord.attempts >= MAX_ATTEMPTS)
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Request a new OTP.' });

    const valid = await otpRecord.verifyOtp(String(otp));

    if (!valid) {
      await Otp.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } });
      const remaining = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP valid — delete it
    await Otp.deleteOne({ phone });

    // Find or auto-create user (role: "user" — no profile completion needed)
    let user = await User.findOne({ phone });
    let isNew = false;

    if (!user) {
      user  = await User.create({ phone, role: 'user' });
      isNew = true;
    }

    if (user.isBanned)
      return res.status(403).json({ success: false, message: 'This account has been banned.' });

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

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
