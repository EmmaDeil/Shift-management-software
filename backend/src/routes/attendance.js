const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getStatus,
  updateAttendance,
} = require('../controllers/attendanceController');

router.use(protect);

router.get('/', getAttendance);
router.get('/status', getStatus);
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-start', startBreak);
router.post('/break-end', endBreak);
router.get('/:id', getAttendance);
router.put('/:id', authorize('admin', 'manager'), updateAttendance);

module.exports = router;
