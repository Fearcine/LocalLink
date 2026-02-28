const express = require('express');
const router = express.Router();
const {
  register,
  search,
  getProfile,
  getMyProfile,
  getContact,
  getTopFreelancers,
  updateProfile
} = require('../controllers/freelancerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/search', search);
router.get('/top', getTopFreelancers);
router.get('/my-profile', protect, authorize('freelancer'), getMyProfile);
router.put('/my-profile', protect, authorize('freelancer'), updateProfile);
router.post(
  '/register',
  protect,
  upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'idProof', maxCount: 1 }]),
  register
);
router.get('/:id', getProfile);
router.get('/:id/contact', protect, getContact);

module.exports = router;
