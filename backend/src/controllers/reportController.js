const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const logger = require('../config/logger');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// @desc    Generate attendance report
// @route   GET /api/v1/reports/attendance
// @access  Private (Admin/Manager)
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required',
      });
    }

      const query = {
        'clockIn.time': {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

    if (employeeId) {
      query.employee = employeeId;
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email department' },
      })
      .populate('shift', 'startTime endTime position')
        .sort('clockIn.time');

    if (format === 'json') {
      return res.json({
        status: 'success',
        data: { attendance },
      });
    }

    // Excel export
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Clock In', key: 'clockIn', width: 20 },
        { header: 'Clock Out', key: 'clockOut', width: 20 },
        { header: 'Total Hours', key: 'totalHours', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      attendance.forEach(record => {
          worksheet.addRow({
            date: record.clockIn?.time ? record.clockIn.time.toLocaleDateString() : 'N/A',
            employeeId: record.employee?.employeeId || 'N/A',
            name: `${record.employee?.user?.firstName} ${record.employee?.user?.lastName}`,
            department: record.employee?.user?.department || 'N/A',
            clockIn: record.clockIn?.time ? record.clockIn.time.toLocaleString() : 'N/A',
            clockOut: record.clockOut?.time ? record.clockOut.time.toLocaleString() : 'Still clocked in',
            totalHours: record.totalHours?.toFixed(2) || '0',
            status: record.status,
          });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.xlsx`);

      return workbook.xlsx.write(res).then(() => res.end());
    }

    // PDF export
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.pdf`);
      
      doc.pipe(res);

      // Title
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Table
      attendance.forEach(record => {
        doc.fontSize(10)
            .text(`Employee: ${record.employee?.user?.firstName} ${record.employee?.user?.lastName} (${record.employee?.employeeId})`)
            .text(`Department: ${record.employee?.user?.department}`)
            .text(`Date: ${record.clockIn?.time ? record.clockIn.time.toLocaleDateString() : 'N/A'}`)
            .text(`Clock In: ${record.clockIn?.time ? record.clockIn.time.toLocaleString() : 'N/A'}`)
            .text(`Clock Out: ${record.clockOut?.time ? record.clockOut.time.toLocaleString() : 'Still clocked in'}`)
            .text(`Total Hours: ${record.totalHours?.toFixed(2) || '0'}`)
            .text(`Status: ${record.status}`)
            .moveDown();
      });

      doc.end();
      return;
    }

    res.status(400).json({
      status: 'error',
      message: 'Invalid format. Use json, excel, or pdf',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate schedule report
// @route   GET /api/v1/reports/schedule
// @access  Private (Admin/Manager)
exports.getScheduleReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required',
      });
    }

    const shifts = await Shift.find({
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email department' },
      })
      .sort('startTime');

    if (format === 'json') {
      return res.json({
        status: 'success',
        data: { shifts },
      });
    }

    // Excel export
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Schedule Report');

      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Employee', key: 'employee', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Start Time', key: 'startTime', width: 20 },
        { header: 'End Time', key: 'endTime', width: 20 },
        { header: 'Duration (hrs)', key: 'duration', width: 15 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      shifts.forEach(shift => {
        worksheet.addRow({
          date: shift.startTime.toLocaleDateString(),
          employee: `${shift.employee?.user?.firstName} ${shift.employee?.user?.lastName}`,
          department: shift.employee?.user?.department || 'N/A',
          position: shift.position,
          startTime: shift.startTime.toLocaleString(),
          endTime: shift.endTime.toLocaleString(),
          duration: shift.duration?.toFixed(2) || '0',
          location: shift.location || 'N/A',
          status: shift.status,
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=schedule-report-${Date.now()}.xlsx`);

      return workbook.xlsx.write(res).then(() => res.end());
    }

    res.status(400).json({
      status: 'error',
      message: 'Invalid format. Use json or excel',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate leave report
// @route   GET /api/v1/reports/leaves
// @access  Private (Admin/Manager)
exports.getLeaveReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required',
      });
    }

    const leaves = await Leave.find({
      startDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email department' },
      })
      .populate('approvedBy', 'firstName lastName')
      .sort('startDate');

    if (format === 'json') {
      return res.json({
        status: 'success',
        data: { leaves },
      });
    }

    // Excel export
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leave Report');

      worksheet.columns = [
        { header: 'Employee', key: 'employee', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 15 },
        { header: 'End Date', key: 'endDate', width: 15 },
        { header: 'Duration (days)', key: 'duration', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Approved By', key: 'approvedBy', width: 20 },
        { header: 'Reason', key: 'reason', width: 30 },
      ];

      leaves.forEach(leave => {
        worksheet.addRow({
          employee: `${leave.employee?.user?.firstName} ${leave.employee?.user?.lastName}`,
          department: leave.employee?.user?.department || 'N/A',
          type: leave.type,
          startDate: leave.startDate.toLocaleDateString(),
          endDate: leave.endDate.toLocaleDateString(),
          duration: leave.duration?.toFixed(1) || '0',
          status: leave.status,
          approvedBy: leave.approvedBy ? `${leave.approvedBy.firstName} ${leave.approvedBy.lastName}` : 'Pending',
          reason: leave.reason || 'N/A',
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=leave-report-${Date.now()}.xlsx`);

      return workbook.xlsx.write(res).then(() => res.end());
    }

    res.status(400).json({
      status: 'error',
      message: 'Invalid format. Use json or excel',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate payroll report
// @route   GET /api/v1/reports/payroll
// @access  Private (Admin)
exports.getPayrollReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required',
      });
    }

    const attendance = await Attendance.find({
      clockIn: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email department' },
      });

    // Group by employee and calculate totals
    const payrollData = {};

    attendance.forEach(record => {
      if (!record.employee) return;

      const empId = record.employee._id.toString();
      
      if (!payrollData[empId]) {
        payrollData[empId] = {
          employee: record.employee,
          totalHours: 0,
          totalCost: 0,
          shifts: 0,
        };
      }

      payrollData[empId].totalHours += record.totalHours || 0;
      payrollData[empId].totalCost += (record.totalHours || 0) * (record.employee.hourlyRate || 0);
      payrollData[empId].shifts += 1;
    });

    const payroll = Object.values(payrollData);

    if (format === 'json') {
      return res.json({
        status: 'success',
        data: { payroll },
      });
    }

    // Excel export
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payroll Report');

      worksheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Hourly Rate', key: 'hourlyRate', width: 15 },
        { header: 'Total Hours', key: 'totalHours', width: 15 },
        { header: 'Total Shifts', key: 'shifts', width: 15 },
        { header: 'Gross Pay', key: 'grossPay', width: 15 },
      ];

      payroll.forEach(record => {
        worksheet.addRow({
          employeeId: record.employee.employeeId,
          name: `${record.employee.user.firstName} ${record.employee.user.lastName}`,
          department: record.employee.user.department,
          email: record.employee.user.email,
          hourlyRate: `$${record.employee.hourlyRate?.toFixed(2) || '0.00'}`,
          totalHours: record.totalHours.toFixed(2),
          shifts: record.shifts,
          grossPay: `$${record.totalCost.toFixed(2)}`,
        });
      });

      // Add totals row
      const totalHours = payroll.reduce((sum, r) => sum + r.totalHours, 0);
      const totalCost = payroll.reduce((sum, r) => sum + r.totalCost, 0);
      
      worksheet.addRow({});
      worksheet.addRow({
        employeeId: 'TOTAL',
        name: '',
        department: '',
        email: '',
        hourlyRate: '',
        totalHours: totalHours.toFixed(2),
        shifts: payroll.reduce((sum, r) => sum + r.shifts, 0),
        grossPay: `$${totalCost.toFixed(2)}`,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=payroll-report-${Date.now()}.xlsx`);

      return workbook.xlsx.write(res).then(() => res.end());
    }

    res.status(400).json({
      status: 'error',
      message: 'Invalid format. Use json or excel',
    });
  } catch (error) {
    next(error);
  }
};
