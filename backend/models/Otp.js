const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * OTP model.
 * One document per phone number — upserted on each send request.
 * TTL index auto-deletes expired documents from MongoDB.
 */
const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL — document is purged automatically after expiry
    index: { expires: 0 },
  },
  // Track verify attempts to enforce max-5 limit
  attempts: {
    type: Number,
    default: 0,
  },
  // Rate-limit sends: store when the last OTP was sent
  lastSentAt: {
    type: Date,
    default: null,
  },
  // Count sends within the current window (reset after 1 h)
  sendCount: {
    type: Number,
    default: 0,
  },
  sendWindowStart: {
    type: Date,
    default: null,
  },
});

/**
 * Hash a plain OTP string and store it.
 */
otpSchema.statics.hashOtp = async function (plain) {
  return bcrypt.hash(plain, 10);
};

/**
 * Compare a plain OTP against the stored hash.
 */
otpSchema.methods.verifyOtp = async function (plain) {
  return bcrypt.compare(plain, this.otpHash);
};

module.exports = mongoose.model('Otp', otpSchema);
