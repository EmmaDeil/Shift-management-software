const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getShiftConflicts,
} = require('../controllers/shiftController');

router.use(protect);

router.get('/', getShifts);
router.get('/conflicts', authorize('admin', 'manager'), getShiftConflicts);
router.post('/', authorize('admin', 'manager'), createShift);
router.get('/:id', getShiftById);
router.put('/:id', authorize('admin', 'manager'), updateShift);
router.delete('/:id', authorize('admin', 'manager'), deleteShift);

module.exports = router;
