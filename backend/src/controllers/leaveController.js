const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// @desc    Get all leave requests
// @route   GET /api/v1/leaves
// @access  Private
exports.getLeaves = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      employee,
      status,
      type,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};
    
    if (employee) query.employee = employee;
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // If employee role, only show their leaves
    if (req.user.role === 'employee') {
      const employeeDoc = await Employee.findOne({ user: req.user.id });
      if (employeeDoc) {
        query.employee = employeeDoc._id;
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate('approvedBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Leave.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        leaves,
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

// @desc    Get single leave request
// @route   GET /api/v1/leaves/:id
// @access  Private
exports.getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      })
      .populate('approvedBy', 'firstName lastName email');

    if (!leave) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
    }

    res.json({
      status: 'success',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create leave request
// @route   POST /api/v1/leaves
// @access  Private
exports.createLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found',
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        status: 'error',
        message: 'End date must be after start date',
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date cannot be in the past',
      });
    }

    // Check for overlapping leaves
    const overlapping = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: start }, endDate: { $gt: start } },
        { startDate: { $lt: end }, endDate: { $gte: end } },
        { startDate: { $gte: start }, endDate: { $lte: end } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a leave request for this period',
      });
    }

    // Create leave request
    const leave = await Leave.create({
      employee: employee._id,
      type,
      startDate,
      endDate,
      reason,
    });

    await leave.populate({
      path: 'employee',
      populate: { path: 'user', select: 'firstName lastName email' },
    });

    // Notify managers
    const User = require('../models/User');
    const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });

    for (const manager of managers) {
      await Notification.create({
        user: manager._id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${req.user.firstName} ${req.user.lastName} has requested ${type} leave`,
        relatedModel: 'Leave',
        relatedId: leave._id,
      });
    }

    logger.info(`Leave request created: ${leave._id} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update leave request
// @route   PUT /api/v1/leaves/:id
// @access  Private
exports.updateLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
    }

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    
    // Check if user owns this leave request
    if (employee && leave.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this leave request',
      });
    }

    // Can only update if pending
    if (leave.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only update pending leave requests',
      });
    }

    const { type, startDate, endDate, reason } = req.body;

    if (type) leave.type = type;
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (reason) leave.reason = reason;

    await leave.save();

    logger.info(`Leave request updated: ${leave._id}`);

    res.json({
      status: 'success',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel leave request
// @route   DELETE /api/v1/leaves/:id
// @access  Private
exports.deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
    }

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    
    // Check if user owns this leave request
    if (employee && leave.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this leave request',
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    logger.info(`Leave request cancelled: ${leave._id}`);

    res.json({
      status: 'success',
      message: 'Leave request cancelled',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve leave request
// @route   POST /api/v1/leaves/:id/approve
// @access  Private (Admin/Manager)
exports.approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' },
      });

    if (!leave) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Leave request has already been processed',
      });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvedAt = Date.now();
    await leave.save();

    // Notify employee
    await Notification.create({
      user: leave.employee.user._id,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${leave.type} leave request has been approved`,
      relatedModel: 'Leave',
      relatedId: leave._id,
    });

    logger.info(`Leave approved: ${leave._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject leave request
// @route   POST /api/v1/leaves/:id/reject
// @access  Private (Admin/Manager)
exports.rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' },
      });

    if (!leave) {
      return res.status(404).json({
        status: 'error',
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Leave request has already been processed',
      });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user.id;
    leave.approvedAt = Date.now();
    await leave.save();

    // Notify employee
    await Notification.create({
      user: leave.employee.user._id,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: `Your ${leave.type} leave request has been rejected`,
      relatedModel: 'Leave',
      relatedId: leave._id,
    });

    logger.info(`Leave rejected: ${leave._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};
