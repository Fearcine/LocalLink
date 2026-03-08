
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * Otp model
 *
 * One document per phone number (upserted on every send).
 * MongoDB TTL index on `expiresAt` purges stale documents automatically —
 * no manual cleanup required.
 *
 * Fields (exactly as specified):
 *   phone     — E.164 phone number, unique key
 *   otpHash   — bcrypt hash of the 6-digit code
 *   expiresAt — absolute expiry timestamp (5 minutes from issue)
 *   attempts  — number of failed verify attempts (max 5)
 */
const otpSchema = new mongoose.Schema({
  phone: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
  },
  otpHash: {
    type:     String,
    required: true,
  },
  expiresAt: {
    type:     Date,
    required: true,
    index:    { expires: 0 }, // MongoDB TTL — auto-delete when expiresAt is past
  },
  attempts: {
    type:    Number,
    default: 0,
    min:     0,
  },
});

// ─── Static helpers ───────────────────────────────────────────────────────────

/**
 * Hash a plain 6-digit OTP using bcrypt (cost factor 10).
 * Called before upserting a new OTP record.
 */
otpSchema.statics.hashOtp = function (plain) {
  return bcrypt.hash(String(plain), 10);
};

// ─── Instance helpers ─────────────────────────────────────────────────────────

/**
 * Compare a plain OTP string against the stored hash.
 * Returns true if they match, false otherwise.
 */
otpSchema.methods.verifyOtp = function (plain) {
  return bcrypt.compare(String(plain), this.otpHash);
};

/**
 * Returns true if this OTP record has expired.
 */
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/**
 * Returns true if the maximum verify-attempt limit has been reached.
 */
otpSchema.methods.isLocked = function () {
  return this.attempts >= 5;
};

module.exports = mongoose.model('Otp', otpSchema);
