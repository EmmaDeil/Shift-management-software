const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardAnalytics,
  getAttendanceTrends,
  getLaborCost,
  getEmployeePerformance,
  getShiftCoverage,
} = require('../controllers/analyticsController');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/attendance-trends', authorize('admin', 'manager'), getAttendanceTrends);
router.get('/labor-cost', authorize('admin', 'manager'), getLaborCost);
router.get('/employee-performance', authorize('admin', 'manager'), getEmployeePerformance);
router.get('/shift-coverage', authorize('admin', 'manager'), getShiftCoverage);

module.exports = router;
