const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAvailability,
  updateEmployeeAvailability,
} = require('../controllers/employeeController');

router.use(protect);

router.get('/', authorize('admin', 'manager'), getEmployees);
router.post('/', authorize('admin', 'manager'), createEmployee);
router.get('/:id', authorize('admin', 'manager'), getEmployeeById);
router.get('/:id/availability', getEmployeeAvailability);
router.put('/:id', authorize('admin', 'manager'), updateEmployee);
router.put('/:id/availability', updateEmployeeAvailability);
router.delete('/:id', authorize('admin'), deleteEmployee);

module.exports = router;
