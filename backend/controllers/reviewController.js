/**
 * Review Controller
 */

const Review = require('../models/Review');
const Freelancer = require('../models/Freelancer');

/**
 * @desc    Add review
 * @route   POST /api/reviews
 * @access  Private (user)
 */
exports.addReview = async (req, res, next) => {
  try {
    const { freelancerId, rating, comment } = req.body;

    if (!freelancerId || !rating) {
      return res.status(400).json({ success: false, message: 'Freelancer ID and rating are required' });
    }

    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer || freelancer.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    // Check existing review
    const existing = await Review.findOne({ freelancer: freelancerId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this freelancer' });
    }

    const review = await Review.create({
      freelancer: freelancerId,
      user: req.user._id,
      rating: parseInt(rating),
      comment
    });

    // Update freelancer stats
    const allReviews = await Review.find({ freelancer: freelancerId, isVisible: true });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    const newStats = {
      'stats.avgRating': Math.round(avgRating * 10) / 10,
      'stats.totalReviews': allReviews.length
    };

    // Recalculate ranking score
    const updatedFreelancer = await Freelancer.findById(freelancerId);
    updatedFreelancer.stats.avgRating = newStats['stats.avgRating'];
    updatedFreelancer.stats.totalReviews = newStats['stats.totalReviews'];
    const score = updatedFreelancer.calculateRankingScore();

    await Freelancer.findByIdAndUpdate(freelancerId, {
      ...newStats,
      'stats.rankingScore': score
    });

    const populated = await Review.findById(review._id).populate('user', 'name avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for freelancer
 * @route   GET /api/reviews/freelancer/:freelancerId
 * @access  Public
 */
exports.getFreelancerReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ freelancer: req.params.freelancerId, isVisible: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ freelancer: req.params.freelancerId, isVisible: true })
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};
