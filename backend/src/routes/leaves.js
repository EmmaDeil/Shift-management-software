const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
} = require('../controllers/leaveController');

router.use(protect);

router.get('/', getLeaves);
router.post('/', createLeave);
router.get('/:id', getLeaveById);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);
router.put('/:id/approve', authorize('admin', 'manager'), approveLeave);
router.put('/:id/reject', authorize('admin', 'manager'), rejectLeave);

module.exports = router;
