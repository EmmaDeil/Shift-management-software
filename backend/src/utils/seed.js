const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Swap = require('../models/Swap');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

const defaultAvailability = {
  monday: { available: true, start: '09:00', end: '17:00' },
  tuesday: { available: true, start: '09:00', end: '17:00' },
  wednesday: { available: true, start: '09:00', end: '17:00' },
  thursday: { available: true, start: '09:00', end: '17:00' },
  friday: { available: true, start: '09:00', end: '17:00' },
  saturday: { available: false },
  sunday: { available: false },
};

const seedUsers = [
  {
    email: 'admin@shiftflow.com',
    firstName: 'Ava',
    lastName: 'Carter',
    role: 'admin',
    phone: '+12025550101',
    department: 'Administration',
    position: 'System Administrator',
    employeeId: 'ADM001',
    hireDate: new Date('2023-01-01T00:00:00.000Z'),
    hourlyRate: 45,
    skills: ['Leadership', 'Operations', 'System Administration'],
  },
  {
    email: 'manager@shiftflow.com',
    firstName: 'Noah',
    lastName: 'Kim',
    role: 'manager',
    phone: '+12025550102',
    department: 'Operations',
    position: 'Operations Manager',
    employeeId: 'MGR001',
    hireDate: new Date('2023-01-05T00:00:00.000Z'),
    hourlyRate: 38,
    skills: ['Leadership', 'Scheduling', 'Team Coordination'],
  },
  {
    email: 'employee1@shiftflow.com',
    firstName: 'Mia',
    lastName: 'Patel',
    role: 'employee',
    phone: '+12025550103',
    department: 'Sales',
    position: 'Sales Associate',
    employeeId: 'EMP001',
    hireDate: new Date('2023-01-15T00:00:00.000Z'),
    hourlyRate: 25,
    skills: ['Customer Service', 'Sales', 'Communication'],
  },
  {
    email: 'employee2@shiftflow.com',
    firstName: 'Liam',
    lastName: 'Brooks',
    role: 'employee',
    phone: '+12025550104',
    department: 'Support',
    position: 'Support Specialist',
    employeeId: 'EMP002',
    hireDate: new Date('2023-02-01T00:00:00.000Z'),
    hourlyRate: 24,
    skills: ['Support', 'Ticketing', 'Problem Solving'],
  },
  {
    email: 'employee3@shiftflow.com',
    firstName: 'Sophia',
    lastName: 'Garcia',
    role: 'employee',
    phone: '+12025550105',
    department: 'Operations',
    position: 'Shift Lead',
    employeeId: 'EMP003',
    hireDate: new Date('2023-02-10T00:00:00.000Z'),
    hourlyRate: 28,
    skills: ['Scheduling', 'Operations', 'Training'],
  },
];

const seedShifts = [
  {
    title: 'Front Desk Morning',
    employeeEmail: 'employee1@shiftflow.com',
    startTime: new Date('2026-05-04T09:00:00.000Z'),
    endTime: new Date('2026-05-04T17:00:00.000Z'),
    location: 'Main Office',
    department: 'Sales',
    status: 'scheduled',
    type: 'regular',
    notes: 'Cover reception and customer walk-ins.',
    color: '#2563eb',
  },
  {
    title: 'Support Evening',
    employeeEmail: 'employee2@shiftflow.com',
    startTime: new Date('2026-05-04T13:00:00.000Z'),
    endTime: new Date('2026-05-04T21:00:00.000Z'),
    location: 'Remote',
    department: 'Support',
    status: 'scheduled',
    type: 'training',
    notes: 'Shadow senior agent for escalations.',
    color: '#7c3aed',
  },
  {
    title: 'Ops Lead Morning',
    employeeEmail: 'employee3@shiftflow.com',
    startTime: new Date('2026-05-05T08:00:00.000Z'),
    endTime: new Date('2026-05-05T16:00:00.000Z'),
    location: 'Warehouse',
    department: 'Operations',
    status: 'in-progress',
    type: 'regular',
    notes: 'Lead the morning handoff and check inventory.',
    color: '#0ea5e9',
  },
  {
    title: 'Manager Oversight',
    employeeEmail: 'manager@shiftflow.com',
    startTime: new Date('2026-05-05T10:00:00.000Z'),
    endTime: new Date('2026-05-05T18:00:00.000Z'),
    location: 'HQ',
    department: 'Operations',
    status: 'scheduled',
    type: 'regular',
    notes: 'Review scheduling gaps and approvals.',
    color: '#16a34a',
  },
];

const seedLeaves = [
  {
    employeeEmail: 'employee1@shiftflow.com',
    type: 'vacation',
    startDate: new Date('2026-05-12T00:00:00.000Z'),
    endDate: new Date('2026-05-14T00:00:00.000Z'),
    reason: 'Family trip',
    status: 'approved',
    reviewNotes: 'Approved; coverage arranged.',
  },
  {
    employeeEmail: 'employee2@shiftflow.com',
    type: 'sick',
    startDate: new Date('2026-05-08T00:00:00.000Z'),
    endDate: new Date('2026-05-09T00:00:00.000Z'),
    reason: 'Medical appointment and rest',
    status: 'pending',
  },
];

const seedLocation = {
  type: 'Point',
  coordinates: [-73.9857, 40.7484],
};

const seedData = async ({ dryRun = false, reset = false } = {}) => {
  const summary = {
    users: 0,
    employees: 0,
    shifts: 0,
    attendance: 0,
    leaves: 0,
    swaps: 0,
    notifications: 0,
  };

  if (dryRun) {
    logger.info('Dry run enabled. No database writes will be performed.');
    logger.info(`Would seed ${seedUsers.length} users, ${seedShifts.length} shifts, ${seedLeaves.length} leaves, and related operational records.`);
    return summary;
  }

  if (mongoose.connection.readyState === 0) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Seed cannot run without a database connection.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
  }

  if (reset) {
    await Promise.all([
      Notification.deleteMany({}),
      Swap.deleteMany({}),
      Leave.deleteMany({}),
      Attendance.deleteMany({}),
      Shift.deleteMany({}),
      Employee.deleteMany({}),
      User.deleteMany({}),
    ]);
    logger.info('Existing seed data cleared before reseeding.');
  }

  const seededUsers = new Map();
  const seededEmployees = new Map();
  const usersByRole = {};

  for (const seedUser of seedUsers) {
    let user = await User.findOne({ email: seedUser.email });

    if (!user) {
      user = await User.create({
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        email: seedUser.email,
        password: 'password',
        role: seedUser.role,
        phone: seedUser.phone,
        department: seedUser.department,
        position: seedUser.position,
        isActive: true,
      });
      summary.users += 1;
      logger.info(`${seedUser.role} user created: ${user.email}`);
    }

    seededUsers.set(seedUser.email, user);
    usersByRole[seedUser.role] = user;

    let employee = await Employee.findOne({
      $or: [{ user: user._id }, { employeeId: seedUser.employeeId }],
    });

    if (!employee) {
      employee = await Employee.create({
        user: user._id,
        employeeId: seedUser.employeeId,
        hireDate: seedUser.hireDate,
        employmentType: 'full-time',
        status: 'active',
        hourlyRate: seedUser.hourlyRate,
        skills: seedUser.skills,
        availability: defaultAvailability,
      });
      summary.employees += 1;
      logger.info(`Employee profile created: ${employee.employeeId}`);
    } else {
      employee.user = user._id;
      employee.employeeId = seedUser.employeeId;
      employee.hireDate = seedUser.hireDate;
      employee.employmentType = 'full-time';
      employee.status = 'active';
      employee.hourlyRate = seedUser.hourlyRate;
      employee.skills = seedUser.skills;
      employee.availability = defaultAvailability;
      await employee.save();
      logger.info(`Employee profile refreshed: ${employee.employeeId}`);
    }

    seededEmployees.set(seedUser.email, employee);
  }

  for (const seedShift of seedShifts) {
    const employee = seededEmployees.get(seedShift.employeeEmail);
    const createdBy = usersByRole.admin || usersByRole.manager;

    if (!employee || !createdBy) {
      continue;
    }

    const shift = await Shift.findOneAndUpdate(
      {
        title: seedShift.title,
        employee: employee._id,
        startTime: seedShift.startTime,
      },
      {
        title: seedShift.title,
        description: seedShift.notes,
        employee: employee._id,
        startTime: seedShift.startTime,
        endTime: seedShift.endTime,
        location: seedShift.location,
        department: seedShift.department,
        status: seedShift.status,
        type: seedShift.type,
        notes: seedShift.notes,
        color: seedShift.color,
        createdBy: createdBy._id,
        updatedBy: usersByRole.manager?._id || usersByRole.admin._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (shift) {
      summary.shifts += 1;
      logger.info(`Shift seeded: ${shift.title} for ${seedShift.employeeEmail}`);
    }
  }

  const shiftsByTitle = new Map(
    (await Shift.find({})).map((record) => [record.title, record])
  );

  const employeeOne = seededEmployees.get('employee1@shiftflow.com');
  const employeeTwo = seededEmployees.get('employee2@shiftflow.com');
  const employeeThree = seededEmployees.get('employee3@shiftflow.com');
  const managerUser = usersByRole.manager;

  if (employeeOne) {
    const shift = shiftsByTitle.get('Front Desk Morning');
    if (shift) {
      await Attendance.findOneAndUpdate(
        { employee: employeeOne._id, shift: shift._id },
        {
          employee: employeeOne._id,
          shift: shift._id,
          clockIn: { time: new Date('2026-05-04T08:54:00.000Z'), location: seedLocation },
          clockOut: { time: new Date('2026-05-04T17:08:00.000Z'), location: seedLocation },
          breaks: [
            {
              start: new Date('2026-05-04T12:02:00.000Z'),
              end: new Date('2026-05-04T12:32:00.000Z'),
              duration: 30,
            },
          ],
          status: 'present',
          isLate: false,
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          approvalStatus: 'approved',
          approvedBy: managerUser?._id,
          notes: 'Seeded attendance record for reception shift.',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      summary.attendance += 1;
    }
  }

  if (employeeThree) {
    const shift = shiftsByTitle.get('Ops Lead Morning');
    if (shift) {
      await Attendance.findOneAndUpdate(
        { employee: employeeThree._id, shift: shift._id },
        {
          employee: employeeThree._id,
          shift: shift._id,
          clockIn: { time: new Date('2026-05-05T08:12:00.000Z'), location: seedLocation },
          clockOut: null,
          status: 'late',
          isLate: true,
          lateMinutes: 12,
          totalHours: 0,
          approvalStatus: 'pending',
          notes: 'Late arrival seeded for operations lead.',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      summary.attendance += 1;
    }
  }

  for (const leaveSeed of seedLeaves) {
    const employee = seededEmployees.get(leaveSeed.employeeEmail);
    if (!employee) {
      continue;
    }

    await Leave.findOneAndUpdate(
      {
        employee: employee._id,
        type: leaveSeed.type,
        startDate: leaveSeed.startDate,
        endDate: leaveSeed.endDate,
      },
      {
        employee: employee._id,
        type: leaveSeed.type,
        startDate: leaveSeed.startDate,
        endDate: leaveSeed.endDate,
        reason: leaveSeed.reason,
        status: leaveSeed.status,
        reviewedBy: leaveSeed.status === 'approved' ? managerUser?._id : undefined,
        reviewedAt: leaveSeed.status === 'approved' ? new Date('2026-05-01T12:00:00.000Z') : undefined,
        reviewNotes: leaveSeed.reviewNotes,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    summary.leaves += 1;
  }

  if (employeeOne && employeeTwo) {
    const shiftOne = shiftsByTitle.get('Front Desk Morning');
    const shiftTwo = shiftsByTitle.get('Support Evening');

    if (shiftOne && shiftTwo) {
      await Swap.findOneAndUpdate(
        { requester: employeeOne._id, requesterShift: shiftOne._id, requestedWith: employeeTwo._id },
        {
          requester: employeeOne._id,
          requestedWith: employeeTwo._id,
          requesterShift: shiftOne._id,
          requestedShift: shiftTwo._id,
          reason: 'Need to attend a morning appointment.',
          status: 'pending',
          peerResponse: { status: 'pending' },
          managerReview: {
            reviewedBy: managerUser?._id,
            status: 'pending',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      summary.swaps += 1;
    }
  }

  const notificationSeeds = [
    {
      recipient: seededUsers.get('employee1@shiftflow.com')?._id,
      type: 'shift-assigned',
      title: 'New shift assigned',
      message: 'You have been scheduled for Front Desk Morning on May 4.',
      priority: 'high',
      actionUrl: '/schedule',
    },
    {
      recipient: seededUsers.get('employee2@shiftflow.com')?._id,
      type: 'leave-approved',
      title: 'Leave approved',
      message: 'Your vacation request from May 12 to May 14 has been approved.',
      priority: 'medium',
      actionUrl: '/leaves',
    },
    {
      recipient: managerUser?._id,
      type: 'swap-requested',
      title: 'Swap request received',
      message: 'A shift swap request is waiting for your review.',
      priority: 'medium',
      actionUrl: '/swaps',
    },
  ];

  for (const notification of notificationSeeds) {
    if (!notification.recipient) {
      continue;
    }

    await Notification.findOneAndUpdate(
      { recipient: notification.recipient, type: notification.type, title: notification.title },
      {
        recipient: notification.recipient,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        isRead: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    summary.notifications += 1;
  }

  return summary;
};

const runSeed = async () => {
  const dryRun = process.env.SEED_DRY_RUN === 'true';
  const reset = process.env.SEED_RESET === 'true';
  const allowFallback = process.env.SEED_ALLOW_DRY_RUN_ON_FAIL === 'true';
  const closeConnection = require.main === module;

  try {
    const summary = await seedData({ dryRun, reset });

    if (dryRun) {
      logger.info('Seed dry run completed.');
      return summary;
    }

    logger.info('✅ Database seeded successfully!');
    logger.info(`Seeded: ${summary.users} users, ${summary.employees} employees, ${summary.shifts} shifts, ${summary.attendance} attendance records, ${summary.leaves} leaves, ${summary.swaps} swaps, ${summary.notifications} notifications.`);
    logger.info('Login credentials:');
    logger.info('  Admin: admin@shiftflow.com / password');
    logger.info('  Manager: manager@shiftflow.com / password');
    logger.info('  Employee 1: employee1@shiftflow.com / password');
    logger.info('  Employee 2: employee2@shiftflow.com / password');
    logger.info('  Employee 3: employee3@shiftflow.com / password');
    return summary;
  } catch (error) {
    if (!dryRun && allowFallback) {
      logger.warn(`Seed connection failed, falling back to dry run: ${error.message}`);
      const summary = await seedData({ dryRun: true, reset });
      logger.info('Seed dry run completed after fallback.');
      return summary;
    }

    logger.error(`Error seeding database: ${error.message}`);
    throw error;
  } finally {
    if (closeConnection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

if (require.main === module) {
  runSeed().catch((error) => {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = runSeed;
module.exports.seedData = seedData;
