const express = require('express');
const router = express.Router();
const {
  getStats,
  getPendingFreelancers,
  approveFreelancer,
  rejectFreelancer,
  getUsers,
  banUser,
  unbanUser,
  getAllFreelancers,
  createCategory,
  toggleCategory
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes protected
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.get('/freelancers', getAllFreelancers);
router.get('/freelancers/pending', getPendingFreelancers);
router.put('/freelancers/:id/approve', approveFreelancer);
router.put('/freelancers/:id/reject', rejectFreelancer);
router.post('/categories', createCategory);
router.put('/categories/:id/toggle', toggleCategory);

module.exports = router;
