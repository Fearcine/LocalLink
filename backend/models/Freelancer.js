const mongoose = require('mongoose');

/**
 * Freelancer model.
 * Freelancers are stored independently - they do NOT reference a User document
 * until admin approves them and a User record is created with role:"freelancer".
 * While pending, all data lives here keyed by phone.
 */
const freelancerSchema = new mongoose.Schema(
  {
    // Links to User document once approved
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Core identity
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'],
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // Categories
    primaryCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Primary category is required'],
    },
    secondaryCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],

    // Profile
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: [{ type: String, trim: true }],
    experience: {
      type: Number,
      min: 0,
      max: 50,
      default: 0,
    },

    // Pricing
    priceModel: {
      type: String,
      enum: ['hourly', 'daily', 'per_job'],
      default: 'hourly',
    },
    priceAmount: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    priceConditions: {
      type: String,
      default: '',
    },

    // Location (GeoJSON Point)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
      address: { type: String, default: '' },
      area:    { type: String, default: '' },
      city:    { type: String, default: '' },
    },
    serviceRadius: {
      type: Number,
      default: 5,
      min: 1,
      max: 50,
    },

    // Availability
    availability: {
      monday:    { type: Boolean, default: true  },
      tuesday:   { type: Boolean, default: true  },
      wednesday: { type: Boolean, default: true  },
      thursday:  { type: Boolean, default: true  },
      friday:    { type: Boolean, default: true  },
      saturday:  { type: Boolean, default: false },
      sunday:    { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime:   { type: String, default: '18:00' },
    },

    // Documents
    profilePhoto: { type: String, default: null },
    idProof:      { type: String, required: [true, 'ID proof is required'] },

    // Approval workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: null },

    // Stats (populated once active)
    stats: {
      avgRating:     { type: Number, default: 0, min: 0, max: 5 },
      totalReviews:  { type: Number, default: 0 },
      jobsCompleted: { type: Number, default: 0 },
      responseSpeed: { type: Number, default: 0, min: 0, max: 10 },
      rankingScore:  { type: Number, default: 0 },
    },

    isTopFreelancer:   { type: Boolean, default: false },
    topFreelancerSince: { type: Date, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

freelancerSchema.index({ location: '2dsphere' });
freelancerSchema.index({ status: 1 });
freelancerSchema.index({ primaryCategory: 1 });
freelancerSchema.index({ 'stats.rankingScore': -1 });
freelancerSchema.index({ phone: 1 });

/**
 * Ranking score formula:
 * (avgRating × 0.5) + (jobsCompleted × 0.3) + (responseSpeed × 0.2)
 * All components normalised to 0–10, result is 0–10.
 */
freelancerSchema.methods.calculateRankingScore = function () {
  const { avgRating, jobsCompleted, responseSpeed } = this.stats;
  const r = (avgRating / 5) * 10;
  const j = Math.min(jobsCompleted / 50, 1) * 10;
  const s = responseSpeed;
  return parseFloat(((r * 0.5) + (j * 0.3) + (s * 0.2)).toFixed(4));
};

freelancerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Freelancer', freelancerSchema);
