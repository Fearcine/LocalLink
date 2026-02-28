const express = require('express');
const router = express.Router();
const { addReview, getFreelancerReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, addReview);
router.get('/freelancer/:freelancerId', getFreelancerReviews);

module.exports = router;
