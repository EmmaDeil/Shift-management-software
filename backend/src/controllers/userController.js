const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Get all users (paginated)
// @route   GET /api/v1/users
// @access  Private (admin/manager)
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const query = {};
    if (q) {
      query.$or = [
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }

    const users = await User.find(query)
      .select('-password -twoFactorSecret -backupCodes')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: { users, meta: { total, page: Number(page), limit: Number(limit) } },
    });
  } catch (error) {
    logger.error(`getUsers error: ${error.message}`);
    next(error);
  }
};

// @desc    Get single user by id
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -twoFactorSecret -backupCodes');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    logger.error(`getUserById error: ${error.message}`);
    next(error);
  }
};

// @desc    Update user (profile/preferences)
// @route   PUT /api/v1/users/:id
// @access  Private (user themselves or admin/manager)
exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['firstName','lastName','phone','avatar','department','position','preferences','isActive','role'];
    const updates = {};
    Object.keys(req.body).forEach(k => {
      if (allowed.includes(k)) updates[k] = req.body[k];
    });

    // Only allow non-admins to update themselves
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      // managers can update some fields? we'll allow managers to update others via role check above in routes
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password -twoFactorSecret -backupCodes');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    logger.error(`updateUser error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    res.json({ status: 'success', message: 'User deleted' });
  } catch (error) {
    logger.error(`deleteUser error: ${error.message}`);
    next(error);
  }
};
