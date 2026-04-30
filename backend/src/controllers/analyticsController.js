const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const logger = require('../config/logger');

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin/Manager)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total employees
    const totalEmployees = await Employee.countDocuments({ status: 'active' });

    // Today's shifts
    const todayShifts = await Shift.countDocuments({
      startTime: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' },
    });

    // Currently clocked in
    const currentlyClockedIn = await Attendance.countDocuments({
      clockIn: { $gte: today },
      clockOut: null,
    });

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // This week's stats
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const weekShifts = await Shift.countDocuments({
      startTime: { $gte: weekStart },
      status: { $ne: 'cancelled' },
    });

    const weekAttendance = await Attendance.countDocuments({
      clockIn: { $gte: weekStart },
    });

    // Upcoming shifts (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingShifts = await Shift.find({
      startTime: { $gte: today, $lt: nextWeek },
      status: { $ne: 'cancelled' },
    })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName avatar' },
      })
      .sort('startTime')
      .limit(10);

    res.json({
      status: 'success',
      data: {
        totalEmployees,
        todayShifts,
        currentlyClockedIn,
        pendingLeaves,
        weekShifts,
        weekAttendance,
        upcomingShifts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance trends
// @route   GET /api/v1/analytics/attendance-trends
// @access  Private (Admin/Manager)
exports.getAttendanceTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const attendance = await Attendance.aggregate([
      {
        $match: {
          clockIn: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clockIn' },
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
          },
          totalHours: { $sum: '$totalHours' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      status: 'success',
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get labor cost analysis
// @route   GET /api/v1/analytics/labor-cost
// @access  Private (Admin/Manager)
exports.getLaborCost = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      clockIn: { $gte: start, $lte: end },
    })
      .populate({
        path: 'employee',
        select: 'hourlyRate',
      });

    let totalCost = 0;
    let totalHours = 0;

    attendance.forEach(record => {
      if (record.totalHours && record.employee?.hourlyRate) {
        const cost = record.totalHours * record.employee.hourlyRate;
        totalCost += cost;
        totalHours += record.totalHours;
      }
    });

    // Group by department
    const costByDepartment = await Attendance.aggregate([
      {
        $match: {
          clockIn: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData',
        },
      },
      { $unwind: '$employeeData' },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeData.user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$userData.department',
          totalHours: { $sum: '$totalHours' },
          records: { $sum: 1 },
        },
      },
    ]);

    res.json({
      status: 'success',
      data: {
        totalCost: totalCost.toFixed(2),
        totalHours: totalHours.toFixed(2),
        averageCostPerHour: totalHours > 0 ? (totalCost / totalHours).toFixed(2) : 0,
        costByDepartment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee performance
// @route   GET /api/v1/analytics/employee-performance
// @access  Private (Admin/Manager)
exports.getEmployeePerformance = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const query = {
      clockIn: { $gte: start, $lte: end },
    };

    if (employeeId) {
      query.employee = employeeId;
    }

    const performance = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$employee',
          totalShifts: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'users',
          localField: 'employee.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          employee: {
            _id: '$employee._id',
            employeeId: '$employee.employeeId',
            user: {
              firstName: '$user.firstName',
              lastName: '$user.lastName',
              email: '$user.email',
              department: '$user.department',
            },
          },
          totalShifts: 1,
          totalHours: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentCount', '$totalShifts'] },
              100,
            ],
          },
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    res.json({
      status: 'success',
      data: { performance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shift coverage stats
// @route   GET /api/v1/analytics/shift-coverage
// @access  Private (Admin/Manager)
exports.getShiftCoverage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(new Date().setDate(new Date().getDate() + 7));

    const shifts = await Shift.find({
      startTime: { $gte: start, $lte: end },
    }).populate('employee');

    // Group by date
    const coverageByDate = {};

    shifts.forEach(shift => {
      const date = shift.startTime.toISOString().split('T')[0];
      
      if (!coverageByDate[date]) {
        coverageByDate[date] = {
          date,
          total: 0,
          scheduled: 0,
          cancelled: 0,
          unfilled: 0,
        };
      }

      coverageByDate[date].total++;
      
      if (shift.status === 'cancelled') {
        coverageByDate[date].cancelled++;
      } else if (shift.status === 'scheduled' && shift.employee) {
        coverageByDate[date].scheduled++;
      } else {
        coverageByDate[date].unfilled++;
      }
    });

    const coverage = Object.values(coverageByDate).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    res.json({
      status: 'success',
      data: { coverage },
    });
  } catch (error) {
    next(error);
  }
};
