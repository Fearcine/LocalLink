const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect
 * Verifies JWT from Authorization header and attaches user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const auth = req.headers.authorization;

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg =
        err.name === 'TokenExpiredError'
          ? 'Token has expired. Please log in again.'
          : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message: msg });
    }

    const user = await User.findById(decoded.id).select('-__v');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authorize(...roles)
 * Usage: authorize('admin'), authorize('admin', 'freelancer')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorised to access this resource.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
