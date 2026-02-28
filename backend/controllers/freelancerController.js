/**
 * Freelancer Controller
 */

const Freelancer = require('../models/Freelancer');
const User = require('../models/User');
const Review = require('../models/Review');
const path = require('path');

/**
 * @desc    Register as freelancer
 * @route   POST /api/freelancers/register
 * @access  Private
 */
exports.register = async (req, res, next) => {
  try {
    // Check if already registered
    const existing = await Freelancer.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered as a freelancer' });
    }

    const {
      primaryCategory,
      secondaryCategories,
      bio,
      skills,
      experience,
      priceModel,
      priceAmount,
      priceConditions,
      location,
      serviceRadius,
      availability
    } = req.body;

    const profilePhoto = req.files?.profilePhoto?.[0]?.path;
    const idProof = req.files?.idProof?.[0]?.path;

    if (!idProof) {
      return res.status(400).json({ success: false, message: 'ID proof is required' });
    }

    const freelancer = await Freelancer.create({
      user: req.user._id,
      primaryCategory,
      secondaryCategories: secondaryCategories ? JSON.parse(secondaryCategories) : [],
      bio,
      skills: skills ? JSON.parse(skills) : [],
      experience: parseInt(experience) || 0,
      priceModel,
      priceAmount: parseFloat(priceAmount),
      priceConditions,
      location: location ? JSON.parse(location) : undefined,
      serviceRadius: parseInt(serviceRadius) || 5,
      availability: availability ? JSON.parse(availability) : undefined,
      profilePhoto,
      idProof,
      status: 'pending'
    });

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'freelancer' });

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Please complete payment to activate your application.',
      freelancer: { id: freelancer._id, status: freelancer.status }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search freelancers
 * @route   GET /api/freelancers/search
 * @access  Public
 */
exports.search = async (req, res, next) => {
  try {
    const {
      category,
      lat,
      lng,
      radius = 20,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'ranking',
      page = 1,
      limit = 12
    } = req.query;

    const filter = { status: 'approved' };

    if (category) filter.primaryCategory = category;
    if (minPrice || maxPrice) {
      filter.priceAmount = {};
      if (minPrice) filter.priceAmount.$gte = parseFloat(minPrice);
      if (maxPrice) filter.priceAmount.$lte = parseFloat(maxPrice);
    }
    if (minRating) filter['stats.avgRating'] = { $gte: parseFloat(minRating) };

    let query;

    // Geospatial search if coordinates provided
    if (lat && lng) {
      query = Freelancer.find({
        ...filter,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000 // convert km to meters
          }
        }
      });
    } else {
      query = Freelancer.find(filter);
    }

    // Sorting
    const sortOptions = {
      ranking: { 'stats.rankingScore': -1 },
      rating: { 'stats.avgRating': -1 },
      price_asc: { priceAmount: 1 },
      price_desc: { priceAmount: -1 }
    };
    query = query.sort(sortOptions[sortBy] || sortOptions.ranking);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    const [freelancers, total] = await Promise.all([
      query
        .populate('user', 'name phone location')
        .populate('primaryCategory', 'name slug icon parentGroup'),
      Freelancer.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: freelancers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single freelancer profile
 * @route   GET /api/freelancers/:id
 * @access  Public
 */
exports.getProfile = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id)
      .populate('user', 'name location')
      .populate('primaryCategory', 'name slug icon parentGroup')
      .populate('secondaryCategories', 'name slug icon');

    if (!freelancer || freelancer.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    // Increment views
    await Freelancer.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Get reviews
    const reviews = await Review.find({ freelancer: req.params.id, isVisible: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { ...freelancer.toObject(), reviews }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get freelancer's own profile
 * @route   GET /api/freelancers/my-profile
 * @access  Private (freelancer)
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user._id })
      .populate('primaryCategory', 'name slug icon')
      .populate('secondaryCategories', 'name slug icon');

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found' });
    }

    res.json({ success: true, data: freelancer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get masked phone for contact
 * @route   GET /api/freelancers/:id/contact
 * @access  Private (authenticated users)
 */
exports.getContact = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id)
      .populate('user', 'phone');

    if (!freelancer || freelancer.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    const phone = freelancer.user.phone;
    // Mask middle digits: +91XXXXX6789
    const masked = phone.slice(0, -7) + 'XXXXX' + phone.slice(-4);

    res.json({
      success: true,
      data: {
        maskedPhone: masked,
        // In production, this would go through a relay system
        relayPhone: freelancer.relayPhone || phone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top freelancers
 * @route   GET /api/freelancers/top
 * @access  Public
 */
exports.getTopFreelancers = async (req, res, next) => {
  try {
    const freelancers = await Freelancer.find({
      status: 'approved',
      isTopFreelancer: true
    })
      .populate('user', 'name')
      .populate('primaryCategory', 'name slug icon')
      .sort({ 'stats.rankingScore': -1 })
      .limit(8);

    res.json({ success: true, data: freelancers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update freelancer profile
 * @route   PUT /api/freelancers/my-profile
 * @access  Private (freelancer)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['bio', 'skills', 'priceAmount', 'priceModel', 'priceConditions',
      'serviceRadius', 'availability', 'location'];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' && field !== 'bio'
          ? JSON.parse(req.body[field])
          : req.body[field];
      }
    });

    const freelancer = await Freelancer.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: freelancer });
  } catch (error) {
    next(error);
  }
};
