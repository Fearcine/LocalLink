/**
 * freelancerController.js
 * Handles freelancer registration (with OTP verification),
 * profile retrieval, search, and contact relay.
 */

const crypto     = require('crypto');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const Freelancer = require('../models/Freelancer');
const User       = require('../models/User');
const Otp        = require('../models/Otp');
const Review     = require('../models/Review');

// ─── helpers ──────────────────────────────────────────────────────────────────

const OTP_TTL_MS   = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SEND_COOLDOWN_MS = 60 * 1000;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateOtp = () => String(crypto.randomInt(100000, 999999));

const dispatchOtp = async (phone, code) => {
  if (process.env.DEV_OTP === 'true') {
    console.log(`\n🔑  [DEV OTP — FREELANCER]  Phone: ${phone}  |  Code: ${code}\n`);
    return;
  }
  throw new Error('SMS provider not configured. Set DEV_OTP=true for development.');
};

// ─── POST /freelancers/register ───────────────────────────────────────────────
/**
 * Step 1: Accept freelancer application form + uploaded files.
 * Saves a PENDING Freelancer document (phone not yet verified).
 * Then issues an OTP to the provided phone.
 */
exports.register = async (req, res, next) => {
  try {
    const {
      name, phone,
      primaryCategory,
      secondaryCategories,
      bio, skills,
      experience,
      priceModel, priceAmount, priceConditions,
      location,
      serviceRadius,
      availability,
    } = req.body;

    // ── Basic validation ──
    if (!name || !phone || !primaryCategory || !priceAmount) {
      return res.status(400).json({
        success: false,
        message: 'name, phone, primaryCategory and priceAmount are required.',
      });
    }

    const profilePhoto = req.files?.profilePhoto?.[0]?.path || null;
    const idProof      = req.files?.idProof?.[0]?.path;

    if (!idProof) {
      return res.status(400).json({ success: false, message: 'ID proof upload is required.' });
    }

    // ── Prevent duplicate applications ──
    const existingFreelancer = await Freelancer.findOne({ phone });
    if (existingFreelancer) {
      if (existingFreelancer.phoneVerified) {
        return res.status(409).json({
          success: false,
          message: 'A freelancer with this phone already exists.',
        });
      }
      // Overwrite unverified draft with fresh data
      await Freelancer.deleteOne({ phone });
    }

    // ── Parse JSON fields sent as strings (multipart/form-data) ──
    const parseJson = (val, fallback) => {
      if (!val) return fallback;
      try { return JSON.parse(val); } catch { return fallback; }
    };

    const skillsArr      = Array.isArray(skills)
      ? skills
      : parseJson(skills, skills ? skills.split(',').map((s) => s.trim()) : []);
    const secondaryCats  = parseJson(secondaryCategories, []);
    const availObj       = parseJson(availability, {});
    const locationObj    = parseJson(location, {});

    await Freelancer.create({
      name,
      phone,
      phoneVerified: false,
      primaryCategory,
      secondaryCategories: secondaryCats.slice(0, 2),
      bio:             bio || '',
      skills:          skillsArr,
      experience:      parseInt(experience) || 0,
      priceModel:      priceModel || 'hourly',
      priceAmount:     parseFloat(priceAmount),
      priceConditions: priceConditions || '',
      location:        locationObj,
      serviceRadius:   parseInt(serviceRadius) || 5,
      availability:    availObj,
      profilePhoto,
      idProof,
      status: 'pending',
    });

    // ── Send OTP ──
    const now     = Date.now();
    const code    = generateOtp();
    const otpHash = await Otp.hashOtp(code);

    // Enforce cooldown
    const existing = await Otp.findOne({ phone });
    if (
      existing?.lastSentAt &&
      now - existing.lastSentAt.getTime() < SEND_COOLDOWN_MS
    ) {
      const wait = Math.ceil(
        (SEND_COOLDOWN_MS - (now - existing.lastSentAt.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait}s before requesting another OTP.`,
      });
    }

    await Otp.findOneAndUpdate(
      { phone },
      { otpHash, expiresAt: new Date(now + OTP_TTL_MS), attempts: 0, lastSentAt: new Date(now) },
      { upsert: true, new: true }
    );

    await dispatchOtp(phone, code);

    return res.status(201).json({
      success: true,
      message: 'Application received. Please verify your phone to complete registration.',
      dev: process.env.DEV_OTP === 'true' ? { code } : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /freelancers/verify-otp ─────────────────────────────────────────────
/**
 * Step 2: Verify OTP for the freelancer's phone.
 * On success: marks phoneVerified=true, creates/links a User record,
 * returns a JWT. Status remains "pending" until admin approves.
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });

    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord)
      return res.status(400).json({ success: false, message: 'No OTP found. Please restart registration.' });

    if (new Date() > otpRecord.expiresAt)
      return res.status(400).json({ success: false, message: 'OTP expired. Please restart registration.' });

    if (otpRecord.attempts >= MAX_ATTEMPTS)
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please restart.' });

    const valid = await otpRecord.verifyOtp(String(otp));
    if (!valid) {
      await Otp.findOneAndUpdate({ phone }, { $inc: { attempts: 1 } });
      const rem = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${rem} attempt${rem !== 1 ? 's' : ''} remaining.`,
      });
    }

    await Otp.deleteOne({ phone });

    // Find the pending freelancer record
    const freelancer = await Freelancer.findOne({ phone, phoneVerified: false });
    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer application not found. Please re-submit the form.',
      });
    }

    // Mark phone verified
    freelancer.phoneVerified = true;
    await freelancer.save();

    // Create or retrieve User record with role:"freelancer"
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: freelancer.name, role: 'freelancer' });
    } else {
      // Upgrade existing user role if needed
      user.role = 'freelancer';
      user.name = user.name || freelancer.name;
      await user.save();
    }

    // Link freelancer → user
    freelancer.user = user._id;
    await freelancer.save();

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);

    return res.json({
      success: true,
      message: 'Phone verified. Your application is under review.',
      token,
      user: {
        id:    user._id,
        phone: user.phone,
        name:  user.name,
        role:  user.role,
      },
      freelancer: {
        id:     freelancer._id,
        status: freelancer.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /freelancers/search ──────────────────────────────────────────────────

exports.search = async (req, res, next) => {
  try {
    const {
      category,
      lat, lng,
      radius   = 20,
      minPrice, maxPrice,
      minRating,
      sortBy   = 'ranking',
      page     = 1,
      limit    = 12,
    } = req.query;

    // Only approved, phone-verified freelancers appear in search
    const filter = { status: 'approved', phoneVerified: true };

    if (category)  filter.primaryCategory = category;
    if (minPrice || maxPrice) {
      filter.priceAmount = {};
      if (minPrice) filter.priceAmount.$gte = parseFloat(minPrice);
      if (maxPrice) filter.priceAmount.$lte = parseFloat(maxPrice);
    }
    if (minRating) filter['stats.avgRating'] = { $gte: parseFloat(minRating) };

    let query;
    if (lat && lng) {
      query = Freelancer.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000,
          },
        },
      });
    } else {
      query = Freelancer.find(filter);
    }

    const sortMap = {
      ranking:    { 'stats.rankingScore': -1 },
      rating:     { 'stats.avgRating': -1 },
      price_asc:  { priceAmount: 1 },
      price_desc: { priceAmount: -1 },
    };
    query = query.sort(sortMap[sortBy] || sortMap.ranking);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .skip(skip)
      .limit(parseInt(limit))
      .populate('primaryCategory', 'name slug icon parentGroup')
      .populate('secondaryCategories', 'name slug icon')
      .select('-idProof');

    const [freelancers, total] = await Promise.all([
      query,
      Freelancer.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: freelancers,
      pagination: {
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /freelancers/top ─────────────────────────────────────────────────────

exports.getTopFreelancers = async (req, res, next) => {
  try {
    const freelancers = await Freelancer.find({
      status: 'approved',
      phoneVerified: true,
      isTopFreelancer: true,
    })
      .populate('primaryCategory', 'name slug icon')
      .sort({ 'stats.rankingScore': -1 })
      .limit(8)
      .select('-idProof');

    return res.json({ success: true, data: freelancers });
  } catch (err) {
    next(err);
  }
};

// ─── GET /freelancers/my-profile ──────────────────────────────────────────────

exports.getMyProfile = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user._id })
      .populate('primaryCategory', 'name slug icon')
      .populate('secondaryCategories', 'name slug icon');

    if (!freelancer)
      return res.status(404).json({ success: false, message: 'Freelancer profile not found.' });

    return res.json({ success: true, data: freelancer });
  } catch (err) {
    next(err);
  }
};

// ─── GET /freelancers/:id ─────────────────────────────────────────────────────

exports.getProfile = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id)
      .populate('primaryCategory', 'name slug icon parentGroup')
      .populate('secondaryCategories', 'name slug icon')
      .select('-idProof');

    if (!freelancer || freelancer.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }

    await Freelancer.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Attach reviews
    let reviews = [];
    try {
      reviews = await Review.find({ freelancer: req.params.id, isVisible: true })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
    } catch (_) { /* Review model may not exist yet */ }

    return res.json({ success: true, data: { ...freelancer.toObject(), reviews } });
  } catch (err) {
    next(err);
  }
};

// ─── GET /freelancers/:id/contact ─────────────────────────────────────────────

exports.getContact = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id).select('phone status relayPhone');

    if (!freelancer || freelancer.status !== 'approved')
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });

    const phone  = freelancer.phone;
    const masked = phone.slice(0, -7) + 'XXXXX' + phone.slice(-4);

    return res.json({
      success: true,
      data: {
        maskedPhone: masked,
        relayPhone:  freelancer.relayPhone || phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /freelancers/my-profile ──────────────────────────────────────────────

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'bio', 'skills', 'priceAmount', 'priceModel',
      'priceConditions', 'serviceRadius', 'availability', 'location',
    ];

    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        try {
          updates[field] =
            typeof req.body[field] === 'string' &&
            ['skills', 'availability', 'location'].includes(field)
              ? JSON.parse(req.body[field])
              : req.body[field];
        } catch {
          updates[field] = req.body[field];
        }
      }
    }

    const freelancer = await Freelancer.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    return res.json({ success: true, data: freelancer });
  } catch (err) {
    next(err);
  }
};
