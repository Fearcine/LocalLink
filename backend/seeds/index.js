/**
 * Database Seed Script
 * Run: node seeds/index.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/locallink';

const categories = [
  // Household
  { name: 'Maid', slug: 'maid', parentGroup: 'Household', icon: '🧹' },
  { name: 'Cleaner', slug: 'cleaner', parentGroup: 'Household', icon: '🫧' },
  { name: 'Cook', slug: 'cook', parentGroup: 'Household', icon: '👨‍🍳' },
  { name: 'Laundry Helper', slug: 'laundry-helper', parentGroup: 'Household', icon: '👕' },
  { name: 'Babysitter', slug: 'babysitter', parentGroup: 'Household', icon: '👶' },

  // Security & Assistance
  { name: 'Watchman', slug: 'watchman', parentGroup: 'Security & Assistance', icon: '💂' },
  { name: 'Elder Care Helper', slug: 'elder-care-helper', parentGroup: 'Security & Assistance', icon: '👴' },
  { name: 'Patient Caretaker', slug: 'patient-caretaker', parentGroup: 'Security & Assistance', icon: '🏥' },

  // Delivery & Errands
  { name: 'Delivery Helper', slug: 'delivery-helper', parentGroup: 'Delivery & Errands', icon: '📦' },
  { name: 'Grocery Runner', slug: 'grocery-runner', parentGroup: 'Delivery & Errands', icon: '🛒' },
  { name: 'Personal Helper', slug: 'personal-helper', parentGroup: 'Delivery & Errands', icon: '🤝' },

  // Maintenance
  { name: 'Electrician', slug: 'electrician', parentGroup: 'Maintenance', icon: '⚡' },
  { name: 'Plumber', slug: 'plumber', parentGroup: 'Maintenance', icon: '🔧' },
  { name: 'Carpenter', slug: 'carpenter', parentGroup: 'Maintenance', icon: '🪚' },
  { name: 'AC Technician', slug: 'ac-technician', parentGroup: 'Maintenance', icon: '❄️' },

  // Moving & Labor
  { name: 'Loader', slug: 'loader', parentGroup: 'Moving & Labor', icon: '💪' },
  { name: 'Shifter Helper', slug: 'shifter-helper', parentGroup: 'Moving & Labor', icon: '🚛' },
  { name: 'Daily Wage Labor', slug: 'daily-wage-labor', parentGroup: 'Moving & Labor', icon: '👷' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared categories');

    // Insert categories
    await Category.insertMany(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
