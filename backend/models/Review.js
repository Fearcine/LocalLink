const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Review cannot exceed 500 characters'],
    trim: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Prevent duplicate reviews
reviewSchema.index({ freelancer: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
