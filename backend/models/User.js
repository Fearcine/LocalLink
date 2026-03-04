const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'freelancer', 'admin'],
      default: 'user',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      area: { type: String, default: '' },
      city: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ location: '2dsphere' });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
