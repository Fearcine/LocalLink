/**
 * Payment Controller (Mock Gateway Abstraction)
 * In production, replace with Razorpay/Stripe integration
 */

const Freelancer = require('../models/Freelancer');
const { v4: uuidv4 } = require('uuid');

const REGISTRATION_FEE = 299; // INR

/**
 * @desc    Initiate registration payment
 * @route   POST /api/payments/initiate
 * @access  Private (freelancer)
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user._id });

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found' });
    }

    if (freelancer.registrationFeePaid) {
      return res.status(400).json({ success: false, message: 'Registration fee already paid' });
    }

    // Mock payment order
    const orderId = `LL-${uuidv4().slice(0, 8).toUpperCase()}`;

    res.json({
      success: true,
      data: {
        orderId,
        amount: REGISTRATION_FEE,
        currency: 'INR',
        description: 'LocalLink Freelancer Registration Fee',
        // In production: return gateway-specific data (Razorpay order, Stripe PaymentIntent etc.)
        mockMode: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify and confirm payment
 * @route   POST /api/payments/verify
 * @access  Private (freelancer)
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId } = req.body;

    // Mock verification - in production verify with gateway signature
    const isValid = orderId && (paymentId || process.env.NODE_ENV === 'development');

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const freelancer = await Freelancer.findOneAndUpdate(
      { user: req.user._id },
      {
        registrationFeePaid: true,
        registrationPaymentId: paymentId || `MOCK-${Date.now()}`
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Payment successful! Your profile is under review.',
      data: { status: freelancer.status, paymentId: freelancer.registrationPaymentId }
    });
  } catch (error) {
    next(error);
  }
};
