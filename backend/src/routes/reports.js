const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAttendanceReport,
  getScheduleReport,
  getLeaveReport,
  getPayrollReport,
} = require('../controllers/reportController');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/attendance', getAttendanceReport);
router.get('/schedule', getScheduleReport);
router.get('/leaves', getLeaveReport);
router.get('/payroll', authorize('admin'), getPayrollReport);

module.exports = router;
