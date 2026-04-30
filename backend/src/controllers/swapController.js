const Swap = require('../models/Swap');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// @desc    Get all swap requests
// @route   GET /api/v1/swaps
// @access  Private
exports.getSwaps = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      employee,
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;

    // If employee role, show swaps they're involved in
    if (req.user.role === 'employee') {
      const employeeDoc = await Employee.findOne({ user: req.user.id });
      if (employeeDoc) {
        query.$or = [
          { requestedBy: employeeDoc._id },
          { requestedTo: employeeDoc._id },
        ];
      }
    } else if (employee) {
      query.$or = [
        { requestedBy: employee },
        { requestedTo: employee },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const swaps = await Swap.find(query)
      .populate({
        path: 'requestedBy',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate({
        path: 'requestedTo',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate('shift')
      .populate('offeredShift')
      .populate('reviewedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Swap.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        swaps,
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

// @desc    Get single swap request
// @route   GET /api/v1/swaps/:id
// @access  Private
exports.getSwapById = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate({
        path: 'requestedBy',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      })
      .populate({
        path: 'requestedTo',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      })
      .populate('shift')
      .populate('offeredShift')
      .populate('reviewedBy', 'firstName lastName email');

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    res.json({
      status: 'success',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create swap request
// @route   POST /api/v1/swaps
// @access  Private
exports.createSwap = async (req, res, next) => {
  try {
    const { shiftId, requestedToId, offeredShiftId, reason } = req.body;

    // Get requesting employee
    const requestedBy = await Employee.findOne({ user: req.user.id });
    if (!requestedBy) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee profile not found',
      });
    }

    // Validate shift belongs to requester
    const shift = await Shift.findOne({
      _id: shiftId,
      employee: requestedBy._id,
    });

    if (!shift) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift not found or does not belong to you',
      });
    }

    // Validate requested employee
    const requestedTo = await Employee.findById(requestedToId).populate('user');
    if (!requestedTo) {
      return res.status(404).json({
        status: 'error',
        message: 'Requested employee not found',
      });
    }

    // Validate offered shift if provided
    if (offeredShiftId) {
      const offeredShift = await Shift.findOne({
        _id: offeredShiftId,
        employee: requestedTo._id,
      });

      if (!offeredShift) {
        return res.status(404).json({
          status: 'error',
          message: 'Offered shift not found or does not belong to requested employee',
        });
      }
    }

    // Create swap request
    const swap = await Swap.create({
      requestedBy: requestedBy._id,
      requestedTo: requestedTo._id,
      shift: shiftId,
      offeredShift: offeredShiftId || undefined,
      reason,
    });

    await swap.populate([
      {
        path: 'requestedBy',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      {
        path: 'requestedTo',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      { path: 'shift' },
      { path: 'offeredShift' },
    ]);

    // Notify requested employee
    await Notification.create({
      user: requestedTo.user._id,
      type: 'swap_request',
      title: 'Shift Swap Request',
      message: `${req.user.firstName} ${req.user.lastName} wants to swap shifts with you`,
      relatedModel: 'Swap',
      relatedId: swap._id,
    });

    logger.info(`Swap request created: ${swap._id} by ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to swap request (accept/reject)
// @route   POST /api/v1/swaps/:id/respond
// @access  Private
exports.respondToSwap = async (req, res, next) => {
  try {
    const { accept } = req.body;

    const swap = await Swap.findById(req.params.id)
      .populate('requestedBy')
      .populate('requestedTo');

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    
    // Check if user is the requested employee
    if (swap.requestedTo._id.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to respond to this swap request',
      });
    }

    // Can only respond to pending requests
    if (swap.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'This swap request has already been processed',
      });
    }

    if (accept) {
      swap.status = 'accepted';
      swap.peerResponse = 'accepted';
      swap.peerResponseAt = Date.now();
    } else {
      swap.status = 'rejected';
      swap.peerResponse = 'rejected';
      swap.peerResponseAt = Date.now();
    }

    await swap.save();

    // Notify requester
    await Notification.create({
      user: swap.requestedBy.user,
      type: accept ? 'swap_accepted' : 'swap_rejected',
      title: `Swap Request ${accept ? 'Accepted' : 'Rejected'}`,
      message: `Your swap request was ${accept ? 'accepted' : 'rejected'}`,
      relatedModel: 'Swap',
      relatedId: swap._id,
    });

    // If accepted, notify managers for approval
    if (accept) {
      const User = require('../models/User');
      const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });

      for (const manager of managers) {
        await Notification.create({
          user: manager._id,
          type: 'swap_pending_approval',
          title: 'Swap Awaiting Approval',
          message: 'A shift swap request needs manager approval',
          relatedModel: 'Swap',
          relatedId: swap._id,
        });
      }
    }

    logger.info(`Swap ${accept ? 'accepted' : 'rejected'}: ${swap._id}`);

    res.json({
      status: 'success',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject swap (Manager)
// @route   POST /api/v1/swaps/:id/review
// @access  Private (Admin/Manager)
exports.reviewSwap = async (req, res, next) => {
  try {
    const { approve } = req.body;

    const swap = await Swap.findById(req.params.id)
      .populate('requestedBy shift offeredShift')
      .populate('requestedTo');

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    // Can only review accepted swaps
    if (swap.status !== 'accepted') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review accepted swap requests',
      });
    }

    if (approve) {
      swap.status = 'approved';
      swap.managerResponse = 'approved';
      swap.reviewedBy = req.user.id;
      swap.reviewedAt = Date.now();

      // Swap the shifts
      const shift = await Shift.findById(swap.shift);
      const offeredShift = swap.offeredShift ? await Shift.findById(swap.offeredShift) : null;

      const tempEmployee = shift.employee;
      shift.employee = swap.requestedTo._id;
      
      if (offeredShift) {
        offeredShift.employee = tempEmployee;
        await offeredShift.save();
      }
      
      await shift.save();
    } else {
      swap.status = 'rejected';
      swap.managerResponse = 'rejected';
      swap.reviewedBy = req.user.id;
      swap.reviewedAt = Date.now();
    }

    await swap.save();

    // Notify both employees
    await Notification.create({
      user: swap.requestedBy.user,
      type: approve ? 'swap_approved' : 'swap_rejected',
      title: `Swap ${approve ? 'Approved' : 'Rejected'}`,
      message: `Your swap request was ${approve ? 'approved' : 'rejected'} by management`,
      relatedModel: 'Swap',
      relatedId: swap._id,
    });

    await Notification.create({
      user: swap.requestedTo.user,
      type: approve ? 'swap_approved' : 'swap_rejected',
      title: `Swap ${approve ? 'Approved' : 'Rejected'}`,
      message: `The swap request was ${approve ? 'approved' : 'rejected'} by management`,
      relatedModel: 'Swap',
      relatedId: swap._id,
    });

    logger.info(`Swap ${approve ? 'approved' : 'rejected'}: ${swap._id} by ${req.user.email}`);

    res.json({
      status: 'success',
      data: { swap },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel swap request
// @route   DELETE /api/v1/swaps/:id
// @access  Private
exports.cancelSwap = async (req, res, next) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    
    // Check if user is the requester
    if (swap.requestedBy.toString() !== employee._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this swap request',
      });
    }

    // Can only cancel pending swaps
    if (swap.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only cancel pending swap requests',
      });
    }

    swap.status = 'cancelled';
    await swap.save();

    logger.info(`Swap cancelled: ${swap._id}`);

    res.json({
      status: 'success',
      message: 'Swap request cancelled',
    });
  } catch (error) {
    next(error);
  }
};
