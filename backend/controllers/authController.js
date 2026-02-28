/**
 * Auth Controller
 * Handles OTP-based phone authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP } = require('../services/otpService');

/**
 * Generate JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const otpCode = process.env.MOCK_OTP === 'true'
      ? (process.env.MOCK_OTP_CODE || '123456')
      : generateOTP();

    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 10) * 60 * 1000);

    // Upsert user with OTP
    await User.findOneAndUpdate(
      { phone },
      {
        phone,
        otp: { code: otpCode, expiresAt, verified: false }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOTP(phone, otpCode);

    res.json({
      success: true,
      message: process.env.MOCK_OTP === 'true'
        ? `OTP sent (MOCK mode - use: ${process.env.MOCK_OTP_CODE || '123456'})`
        : 'OTP sent successfully',
      mock: process.env.MOCK_OTP === 'true'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP and login/register
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this number' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned.' });
    }

    // Mark OTP verified and clear it
    user.otp = { verified: true, code: null, expiresAt: null };
    user.lastLogin = new Date();
    const isNewUser = !user.name;
    await user.save();

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isNewUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete profile (new user)
 * @route   PUT /api/auth/complete-profile
 * @access  Private
 */
exports.completeProfile = async (req, res, next) => {
  try {
    const { name, email, role, location } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const allowedRoles = ['user', 'freelancer'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, role: userRole, location },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile completed',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin login (secret-based)
 * @route   POST /api/auth/admin-login
 * @access  Public
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { phone, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    let admin = await User.findOne({ phone, role: 'admin' });

    if (!admin) {
      admin = await User.create({
        phone,
        name: 'Admin',
        role: 'admin'
      });
    }

    const token = signToken(admin._id);

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};
