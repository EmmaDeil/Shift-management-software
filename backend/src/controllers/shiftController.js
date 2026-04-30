const Shift = require('../models/Shift');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// @desc    Get all shifts
// @route   GET /api/v1/shifts
// @access  Private
exports.getShifts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      employee,
      status,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};
    
    if (employee) query.employee = employee;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // If employee role, only show their shifts
    if (req.user.role === 'employee') {
      const employeeDoc = await Employee.findOne({ user: req.user.id });
      if (employeeDoc) {
        query.employee = employeeDoc._id;
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const shifts = await Shift.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort('startTime');

    const total = await Shift.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        shifts,
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

// @desc    Get single shift
// @route   GET /api/v1/shifts/:id
// @access  Private
exports.getShiftById = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      });

    if (!shift) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift not found',
      });
    }

    res.json({
      status: 'success',
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shift
// @route   POST /api/v1/shifts
// @access  Private (Admin/Manager)
exports.createShift = async (req, res, next) => {
  try {
    const {
      employee,
      startTime,
      endTime,
      position,
      location,
      notes,
    } = req.body;

    // Validate employee exists
    const employeeDoc = await Employee.findById(employee);
    if (!employeeDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Check for overlapping shifts
    const overlapping = await Shift.findOne({
      employee,
      status: { $nin: ['cancelled'] },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    });

    if (overlapping) {
      return res.status(400).json({
        status: 'error',
        message: 'Employee already has a shift during this time',
      });
    }

    // Create shift
    const shift = await Shift.create({
      employee,
      startTime,
      endTime,
      position,
      location,
      notes,
      createdBy: req.user.id,
    });

    await shift.populate({
      path: 'employee',
      populate: { path: 'user', select: 'firstName lastName email' },
    });

    // Create notification for employee
    await Notification.create({
      user: employeeDoc.user,
      type: 'shift_assigned',
      title: 'New Shift Assigned',
      message: `You have been assigned a shift on ${new Date(startTime).toLocaleDateString()}`,
      relatedModel: 'Shift',
      relatedId: shift._id,
    });

    logger.info(`Shift created: ${shift._id} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shift
// @route   PUT /api/v1/shifts/:id
// @access  Private (Admin/Manager)
exports.updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift not found',
      });
    }

    const {
      employee,
      startTime,
      endTime,
      position,
      location,
      status,
      notes,
    } = req.body;

    // If changing employee or times, check for conflicts
    if (employee || startTime || endTime) {
      const checkEmployee = employee || shift.employee;
      const checkStart = startTime || shift.startTime;
      const checkEnd = endTime || shift.endTime;

      const overlapping = await Shift.findOne({
        _id: { $ne: shift._id },
        employee: checkEmployee,
        status: { $nin: ['cancelled'] },
        $or: [
          { startTime: { $lte: checkStart }, endTime: { $gt: checkStart } },
          { startTime: { $lt: checkEnd }, endTime: { $gte: checkEnd } },
          { startTime: { $gte: checkStart }, endTime: { $lte: checkEnd } },
        ],
      });

      if (overlapping) {
        return res.status(400).json({
          status: 'error',
          message: 'Employee already has a shift during this time',
        });
      }
    }

    // Update fields
    if (employee) shift.employee = employee;
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (position) shift.position = position;
    if (location) shift.location = location;
    if (status) shift.status = status;
    if (notes) shift.notes = notes;

    await shift.save();
    await shift.populate({
      path: 'employee',
      populate: { path: 'user', select: 'firstName lastName email' },
    });

    // Notify employee of changes
    const employeeDoc = await Employee.findById(shift.employee);
    await Notification.create({
      user: employeeDoc.user,
      type: 'shift_updated',
      title: 'Shift Updated',
      message: `Your shift on ${new Date(shift.startTime).toLocaleDateString()} has been updated`,
      relatedModel: 'Shift',
      relatedId: shift._id,
    });

    logger.info(`Shift updated: ${shift._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { shift },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete shift
// @route   DELETE /api/v1/shifts/:id
// @access  Private (Admin/Manager)
exports.deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift not found',
      });
    }

    // Cancel instead of hard delete
    shift.status = 'cancelled';
    await shift.save();

    // Notify employee
    const employeeDoc = await Employee.findById(shift.employee);
    await Notification.create({
      user: employeeDoc.user,
      type: 'shift_cancelled',
      title: 'Shift Cancelled',
      message: `Your shift on ${new Date(shift.startTime).toLocaleDateString()} has been cancelled`,
      relatedModel: 'Shift',
      relatedId: shift._id,
    });

    logger.info(`Shift cancelled: ${shift._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Shift cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shift conflicts
// @route   GET /api/v1/shifts/conflicts
// @access  Private (Admin/Manager)
exports.getShiftConflicts = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      status: { $nin: ['cancelled'] },
    };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const shifts = await Shift.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort('startTime');

    // Find overlapping shifts
    const conflicts = [];
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        if (
          shifts[i].employee._id.toString() === shifts[j].employee._id.toString() &&
          shifts[i].startTime < shifts[j].endTime &&
          shifts[i].endTime > shifts[j].startTime
        ) {
          conflicts.push({
            shift1: shifts[i],
            shift2: shifts[j],
            employee: shifts[i].employee,
          });
        }
      }
    }

    res.json({
      status: 'success',
      data: { conflicts },
    });
  } catch (error) {
    next(error);
  }
};
