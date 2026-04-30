const Employee = require('../models/Employee');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get all employees
// @route   GET /api/v1/employees
// @access  Private
exports.getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      department,
      employmentType,
      search,
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (employmentType) query.employmentType = employmentType;
    
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      
      query.user = { $in: users.map(u => u._id) };
    }

    if (department) {
      const users = await User.find({ department }).select('_id');
      query.user = { $in: users.map(u => u._id) };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const employees = await Employee.find(query)
      .populate('user', 'firstName lastName email phone department position avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Employee.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/v1/employees/:id
// @access  Private
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'firstName lastName email phone department position avatar isActive');

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    res.json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create employee
// @route   POST /api/v1/employees
// @access  Private (Admin/Manager)
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      // User details
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      position,
      role = 'employee',
      // Employee details
      employeeId,
      hireDate,
      employmentType,
      hourlyRate,
      skills,
      certifications,
      availability,
      emergencyContact,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email',
      });
    }

    // Check if employee ID is unique
    if (employeeId) {
      const existingEmployee = await Employee.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          status: 'error',
          message: 'Employee ID already exists',
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      position,
      role,
    });

    // Create employee profile
    const employee = await Employee.create({
      user: user._id,
      employeeId,
      hireDate,
      employmentType,
      hourlyRate,
      skills,
      certifications,
      availability,
      emergencyContact,
    });

    await employee.populate('user', 'firstName lastName email phone department position');

    logger.info(`New employee created: ${employee.employeeId} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/v1/employees/:id
// @access  Private (Admin/Manager)
exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    const {
      // User updates
      firstName,
      lastName,
      phone,
      department,
      position,
      // Employee updates
      employeeId,
      employmentType,
      status,
      hourlyRate,
      skills,
      certifications,
      availability,
      emergencyContact,
    } = req.body;

    // Update user details
    const userUpdates = {};
    if (firstName) userUpdates.firstName = firstName;
    if (lastName) userUpdates.lastName = lastName;
    if (phone) userUpdates.phone = phone;
    if (department) userUpdates.department = department;
    if (position) userUpdates.position = position;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(employee.user, userUpdates);
    }

    // Update employee details
    if (employeeId) employee.employeeId = employeeId;
    if (employmentType) employee.employmentType = employmentType;
    if (status) employee.status = status;
    if (hourlyRate !== undefined) employee.hourlyRate = hourlyRate;
    if (skills) employee.skills = skills;
    if (certifications) employee.certifications = certifications;
    if (availability) employee.availability = availability;
    if (emergencyContact) employee.emergencyContact = emergencyContact;

    await employee.save();
    await employee.populate('user', 'firstName lastName email phone department position');

    logger.info(`Employee updated: ${employee.employeeId} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/v1/employees/:id
// @access  Private (Admin only)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Soft delete - deactivate user and mark employee as terminated
    await User.findByIdAndUpdate(employee.user, { isActive: false });
    employee.status = 'terminated';
    await employee.save();

    logger.info(`Employee deleted: ${employee.employeeId} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee availability
// @route   GET /api/v1/employees/:id/availability
// @access  Private
exports.getEmployeeAvailability = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    res.json({
      status: 'success',
      data: { availability: employee.availability },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee availability
// @route   PUT /api/v1/employees/:id/availability
// @access  Private
exports.updateEmployeeAvailability = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Check if user can update (self or admin/manager)
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      employee.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this availability',
      });
    }

    employee.availability = req.body.availability;
    await employee.save();

    logger.info(`Availability updated for employee: ${employee.employeeId}`);

    res.json({
      status: 'success',
      data: { availability: employee.availability },
    });
  } catch (error) {
    next(error);
  }
};
