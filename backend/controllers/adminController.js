/**
 * Admin Controller
 */

const User = require('../models/User');
const Freelancer = require('../models/Freelancer');
const Category = require('../models/Category');
const Review = require('../models/Review');

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private (admin)
 */
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalFreelancers,
      pendingFreelancers,
      approvedFreelancers,
      bannedUsers,
      totalReviews
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Freelancer.countDocuments(),
      Freelancer.countDocuments({ status: 'pending' }),
      Freelancer.countDocuments({ status: 'approved' }),
      User.countDocuments({ isBanned: true }),
      Review.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFreelancers,
        pendingFreelancers,
        approvedFreelancers,
        bannedUsers,
        totalReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending freelancers
 * @route   GET /api/admin/freelancers/pending
 * @access  Private (admin)
 */
exports.getPendingFreelancers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [freelancers, total] = await Promise.all([
      Freelancer.find({ status: 'pending' })
        .populate('user', 'name phone createdAt')
        .populate('primaryCategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Freelancer.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: freelancers,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve freelancer
 * @route   PUT /api/admin/freelancers/:id/approve
 * @access  Private (admin)
 */
exports.approveFreelancer = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: null },
      { new: true }
    );

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    res.json({ success: true, message: 'Freelancer approved successfully', data: freelancer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject freelancer
 * @route   PUT /api/admin/freelancers/:id/reject
 * @access  Private (admin)
 */
exports.rejectFreelancer = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const freelancer = await Freelancer.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    res.json({ success: true, message: 'Freelancer rejected', data: freelancer });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { role: { $ne: 'admin' } };
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ban user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Private (admin)
 */
exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: reason },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User banned', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unban user
 * @route   PUT /api/admin/users/:id/unban
 * @access  Private (admin)
 */
exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: null },
      { new: true }
    );

    res.json({ success: true, message: 'User unbanned', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all freelancers (admin view)
 * @route   GET /api/admin/freelancers
 * @access  Private (admin)
 */
exports.getAllFreelancers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;

    const [freelancers, total] = await Promise.all([
      Freelancer.find(filter)
        .populate('user', 'name phone isBanned')
        .populate('primaryCategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Freelancer.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: freelancers,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manage categories
 * @route   POST /api/admin/categories
 * @access  Private (admin)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, parentGroup, icon, description } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = await Category.create({ name, slug, parentGroup, icon, description });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle category active status
 * @route   PUT /api/admin/categories/:id/toggle
 * @access  Private (admin)
 */
exports.toggleCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
