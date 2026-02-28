const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  parentGroup: {
    type: String,
    required: true,
    enum: ['Household', 'Security & Assistance', 'Delivery & Errands', 'Maintenance', 'Moving & Labor']
  },
  icon: {
    type: String,
    default: '🔧'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
