const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  primaryCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  secondaryCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },

  // Pricing
  priceModel: {
    type: String,
    enum: ['hourly', 'daily', 'per_job'],
    default: 'hourly'
  },
  priceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  priceConditions: String,

  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String,
    city: String,
    area: String
  },
  serviceRadius: {
    type: Number,
    default: 5,
    min: 1,
    max: 50
  },

  // Availability
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' }
  },

  // Documents
  profilePhoto: String,
  idProof: String,

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  rejectionReason: String,

  // Payment
  registrationFeePaid: {
    type: Boolean,
    default: false
  },
  registrationPaymentId: String,

  // Stats & Ranking
  stats: {
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    responseSpeed: { type: Number, default: 0, min: 0, max: 10 }, // 0-10 score
    rankingScore: { type: Number, default: 0 }
  },

  // Top freelancer badge (updated weekly by cron)
  isTopFreelancer: {
    type: Boolean,
    default: false
  },
  topFreelancerSince: Date,

  // Phone relay (masked contact)
  relayPhone: String,

  views: { type: Number, default: 0 }

}, { timestamps: true });

// Geospatial index
freelancerSchema.index({ location: '2dsphere' });
freelancerSchema.index({ 'stats.rankingScore': -1 });
freelancerSchema.index({ status: 1 });
freelancerSchema.index({ primaryCategory: 1 });

/**
 * Calculate ranking score
 * Formula: (avgRating × 0.5) + (jobsCompleted × 0.3) + (responseSpeed × 0.2)
 * Normalized to 0-100 scale
 */
freelancerSchema.methods.calculateRankingScore = function () {
  const { avgRating, jobsCompleted, responseSpeed } = this.stats;
  const normalizedRating = (avgRating / 5) * 10;
  const normalizedJobs = Math.min(jobsCompleted / 50, 1) * 10;
  const normalizedResponse = responseSpeed;

  return (normalizedRating * 0.5) + (normalizedJobs * 0.3) + (normalizedResponse * 0.2);
};

module.exports = mongoose.model('Freelancer', freelancerSchema);
