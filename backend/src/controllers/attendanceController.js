const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const logger = require('../config/logger');

const generateEmployeeId = () => `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const ensureEmployeeProfile = async (user) => {
  const existing = await Employee.findOne({ user: user.id || user._id });
  if (existing) return existing;

  return Employee.create({
    user: user.id || user._id,
    employeeId: generateEmployeeId(),
    hireDate: new Date(),
  });
};

// @desc    Get attendance records
// @route   GET /api/v1/attendance
// @access  Private
exports.getAttendance = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      employee,
      startDate,
      endDate,
      status,
    } = req.query;

    // Build query
    const query = {};
    
    if (employee) query.employee = employee;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.clockIn = {};
      if (startDate) query.clockIn.$gte = new Date(startDate);
      if (endDate) query.clockIn.$lte = new Date(endDate);
    }

    // If employee role, only show their attendance
    if (req.user.role === 'employee') {
      const employeeDoc = await ensureEmployeeProfile(req.user);
      query.employee = employeeDoc._id;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate('shift', 'startTime endTime position location')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-clockIn');

    const total = await Attendance.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        attendance,
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

// @desc    Clock in
// @route   POST /api/v1/attendance/clock-in
// @access  Private
exports.clockIn = async (req, res, next) => {
  try {
    const { shiftId, location } = req.body;

    // Get employee
    const employee = await ensureEmployeeProfile(req.user);

    // Check if already clocked in
    const existingClockIn = await Attendance.findOne({
      employee: employee._id,
      clockOut: null,
    });

    if (existingClockIn) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already clocked in',
      });
    }

    // Verify shift exists and belongs to employee
    let shift = null;
    if (shiftId) {
      shift = await Shift.findOne({
        _id: shiftId,
        employee: employee._id,
      });

      if (!shift) {
        return res.status(404).json({
          status: 'error',
          message: 'Shift not found or does not belong to you',
        });
      }
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employee: employee._id,
      shift: shiftId || undefined,
      clockIn: new Date(),
      clockInLocation: location,
      status: 'present',
    });

    await attendance.populate([
      {
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      { path: 'shift' },
    ]);

    logger.info(`Employee clocked in: ${employee.employeeId}`);

    res.status(201).json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clock out
// @route   POST /api/v1/attendance/clock-out
// @access  Private
exports.clockOut = async (req, res, next) => {
  try {
    const { location } = req.body;

    // Get employee
    const employee = await ensureEmployeeProfile(req.user);

    // Find active clock-in
    const attendance = await Attendance.findOne({
      employee: employee._id,
      clockOut: null,
    });

    if (!attendance) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not clocked in',
      });
    }

    // End any active break
    if (attendance.breaks.length > 0) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (!lastBreak.end) {
        lastBreak.end = new Date();
      }
    }

    // Clock out
    attendance.clockOut = new Date();
    attendance.clockOutLocation = location;
    await attendance.save();

    await attendance.populate([
      {
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      { path: 'shift' },
    ]);

    logger.info(`Employee clocked out: ${employee.employeeId}, Hours: ${attendance.totalHours}`);

    res.json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start break
// @route   POST /api/v1/attendance/start-break
// @access  Private
exports.startBreak = async (req, res, next) => {
  try {
    // Get employee
    const employee = await ensureEmployeeProfile(req.user);

    // Find active clock-in
    const attendance = await Attendance.findOne({
      employee: employee._id,
      clockOut: null,
    });

    if (!attendance) {
      return res.status(400).json({
        status: 'error',
        message: 'You must be clocked in to start a break',
      });
    }

    // Check if already on break
    if (attendance.breaks.length > 0) {
      const lastBreak = attendance.breaks[attendance.breaks.length - 1];
      if (!lastBreak.end) {
        return res.status(400).json({
          status: 'error',
          message: 'You are already on a break',
        });
      }
    }

    // Start break
    attendance.breaks.push({ start: new Date() });
    await attendance.save();

    logger.info(`Employee started break: ${employee.employeeId}`);

    res.json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End break
// @route   POST /api/v1/attendance/end-break
// @access  Private
exports.endBreak = async (req, res, next) => {
  try {
    // Get employee
    const employee = await ensureEmployeeProfile(req.user);

    // Find active clock-in
    const attendance = await Attendance.findOne({
      employee: employee._id,
      clockOut: null,
    });

    if (!attendance) {
      return res.status(400).json({
        status: 'error',
        message: 'You must be clocked in to end a break',
      });
    }

    // Check if on break
    if (attendance.breaks.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not on a break',
      });
    }

    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak.end) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not on a break',
      });
    }

    // End break
    lastBreak.end = new Date();
    await attendance.save();

    logger.info(`Employee ended break: ${employee.employeeId}`);

    res.json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee's current status
// @route   GET /api/v1/attendance/status
// @access  Private
exports.getStatus = async (req, res, next) => {
  try {
    // Get employee
    const employee = await ensureEmployeeProfile(req.user);

    // Find active clock-in
    const attendance = await Attendance.findOne({
      employee: employee._id,
      clockOut: null,
    }).populate('shift');

    if (!attendance) {
      return res.json({
        status: 'success',
        data: {
          isClockedIn: false,
          onBreak: false,
        },
      });
    }

    const onBreak = attendance.breaks.length > 0 && !attendance.breaks[attendance.breaks.length - 1].end;

    res.json({
      status: 'success',
      data: {
        isClockedIn: true,
        onBreak,
        attendance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance (Admin/Manager)
// @route   PUT /api/v1/attendance/:id
// @access  Private (Admin/Manager)
exports.updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        status: 'error',
        message: 'Attendance record not found',
      });
    }

    const { clockIn, clockOut, status, notes } = req.body;

    if (clockIn) attendance.clockIn = clockIn;
    if (clockOut) attendance.clockOut = clockOut;
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;

    await attendance.save();

    logger.info(`Attendance updated: ${attendance._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};
