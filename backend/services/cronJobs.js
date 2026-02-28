/**
 * Cron Jobs Service
 * Handles scheduled tasks like weekly ranking updates
 */

const cron = require('node-cron');
const Freelancer = require('../models/Freelancer');

/**
 * Update top freelancers weekly
 * Runs every Monday at 00:00
 */
const updateTopFreelancers = async () => {
  try {
    console.log('🔄 Running weekly top freelancer update...');

    // Recalculate ranking scores for all approved freelancers
    const freelancers = await Freelancer.find({ status: 'approved' });

    const updates = freelancers.map(async (f) => {
      const score = f.calculateRankingScore();
      f.stats.rankingScore = score;
      return f.save();
    });

    await Promise.all(updates);

    // Reset all top freelancer flags
    await Freelancer.updateMany({}, { isTopFreelancer: false });

    // Mark top 20 freelancers per category
    const categories = [...new Set(freelancers.map(f => f.primaryCategory.toString()))];

    for (const categoryId of categories) {
      await Freelancer.find({
        primaryCategory: categoryId,
        status: 'approved'
      })
        .sort({ 'stats.rankingScore': -1 })
        .limit(5)
        .then(async (topOnes) => {
          for (const f of topOnes) {
            await Freelancer.findByIdAndUpdate(f._id, {
              isTopFreelancer: true,
              topFreelancerSince: new Date()
            });
          }
        });
    }

    console.log(`✅ Top freelancer update complete. Processed ${freelancers.length} freelancers.`);
  } catch (error) {
    console.error('❌ Cron job error:', error.message);
  }
};

const startAll = () => {
  // Every Monday at midnight
  cron.schedule('0 0 * * 1', updateTopFreelancers);

  // Also run on startup after a short delay (dev convenience)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(updateTopFreelancers, 5000);
  }

  console.log('⏰ Cron jobs scheduled');
};

module.exports = { startAll, updateTopFreelancers };
