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
          { requester: employeeDoc._id },
          { requestedWith: employeeDoc._id },
        ];
      }
    } else if (employee) {
      query.$or = [
        { requester: employee },
        { requestedWith: employee },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const swaps = await Swap.find(query)
      .populate({
        path: 'requester',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate({
        path: 'requestedWith',
        populate: { path: 'user', select: 'firstName lastName email avatar' },
      })
      .populate('requesterShift')
      .populate('requestedShift')
      .populate({ path: 'managerReview.reviewedBy', select: 'firstName lastName email' })
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
        path: 'requester',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      })
      .populate({
        path: 'requestedWith',
        populate: { path: 'user', select: 'firstName lastName email phone avatar' },
      })
      .populate('requesterShift')
      .populate('requestedShift')
      .populate({ path: 'managerReview.reviewedBy', select: 'firstName lastName email' });

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
      requester: requestedBy._id,
      requestedWith: requestedTo._id,
      requesterShift: shiftId,
      requestedShift: offeredShiftId || shiftId,
      reason,
    });

    await swap.populate([
      {
        path: 'requester',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      {
        path: 'requestedWith',
        populate: { path: 'user', select: 'firstName lastName email' },
      },
      { path: 'requesterShift' },
      { path: 'requestedShift' },
    ]);

    // Notify requested employee
    await Notification.create({
      recipient: requestedTo.user._id,
      type: 'swap-requested',
      title: 'Shift Swap Request',
      message: `${req.user.firstName} ${req.user.lastName} wants to swap shifts with you`,
      data: { swapId: swap._id },
      priority: 'high',
      actionUrl: '/swaps',
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
      .populate({ path: 'requester', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate({ path: 'requestedWith', populate: { path: 'user', select: 'firstName lastName email' } });

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    // Get employee
    const employee = await Employee.findOne({ user: req.user.id });
    
    // Check if user is the requested employee
    if (swap.requestedWith._id.toString() !== employee._id.toString()) {
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
      swap.status = 'peer-accepted';
      swap.peerResponse.status = 'accepted';
      swap.peerResponse.respondedAt = Date.now();
    } else {
      swap.status = 'peer-rejected';
      swap.peerResponse.status = 'rejected';
      swap.peerResponse.respondedAt = Date.now();
    }

    await swap.save();

    // Notify requester
    await Notification.create({
      recipient: swap.requester.user._id,
      type: accept ? 'swap-accepted' : 'swap-rejected',
      title: `Swap Request ${accept ? 'Accepted' : 'Rejected'}`,
      message: `Your swap request was ${accept ? 'accepted' : 'rejected'}`,
      data: { swapId: swap._id },
      priority: 'medium',
      actionUrl: '/swaps',
    });

    // If accepted, notify managers for approval
    if (accept) {
      const User = require('../models/User');
      const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true });

      for (const manager of managers) {
        await Notification.create({
          recipient: manager._id,
          type: 'swap-requested',
          title: 'Swap Awaiting Approval',
          message: 'A shift swap request needs manager approval',
          data: { swapId: swap._id },
          priority: 'medium',
          actionUrl: '/swaps',
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
      .populate({ path: 'requester', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate({ path: 'requestedWith', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('requesterShift')
      .populate('requestedShift');

    if (!swap) {
      return res.status(404).json({
        status: 'error',
        message: 'Swap request not found',
      });
    }

    // Can only review accepted swaps
    if (swap.status !== 'peer-accepted') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review accepted swap requests',
      });
    }

    if (approve) {
      swap.status = 'manager-approved';
      swap.managerReview.status = 'approved';
      swap.managerReview.reviewedBy = req.user.id;
      swap.managerReview.reviewedAt = Date.now();

      // Swap the shifts
      const shift = await Shift.findById(swap.requesterShift);
      const offeredShift = swap.requestedShift ? await Shift.findById(swap.requestedShift) : null;

      const tempEmployee = shift.employee;
      shift.employee = swap.requestedWith._id;
      
      if (offeredShift) {
        offeredShift.employee = tempEmployee;
        await offeredShift.save();
      }
      
      await shift.save();
    } else {
      swap.status = 'manager-rejected';
      swap.managerReview.status = 'rejected';
      swap.managerReview.reviewedBy = req.user.id;
      swap.managerReview.reviewedAt = Date.now();
    }

    await swap.save();

    // Notify both employees
    await Notification.create({
      recipient: swap.requester.user._id,
      type: approve ? 'swap-accepted' : 'swap-rejected',
      title: `Swap ${approve ? 'Approved' : 'Rejected'}`,
      message: `Your swap request was ${approve ? 'approved' : 'rejected'} by management`,
      data: { swapId: swap._id },
      priority: 'medium',
      actionUrl: '/swaps',
    });

    await Notification.create({
      recipient: swap.requestedWith.user._id,
      type: approve ? 'swap-accepted' : 'swap-rejected',
      title: `Swap ${approve ? 'Approved' : 'Rejected'}`,
      message: `The swap request was ${approve ? 'approved' : 'rejected'} by management`,
      data: { swapId: swap._id },
      priority: 'medium',
      actionUrl: '/swaps',
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
    if (swap.requester.toString() !== employee._id.toString()) {
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
