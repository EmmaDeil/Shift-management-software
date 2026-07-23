require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const logger = require('../config/logger');

const TARGET_EMAIL = process.env.ADMIN_EMAIL;
const TARGET_FIRST_NAME = process.env.ADMIN_FIRST_NAME;
const TARGET_LAST_NAME = process.env.ADMIN_LAST_NAME;
const TARGET_PASSWORD = process.env.ADMIN_PASSWORD;

const generateEmployeeId = () => `ADM-${Date.now()}`;

const connect = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI or MONGO_URI is required');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
};

const upsertAdmin = async () => {
  if (!TARGET_EMAIL || !TARGET_FIRST_NAME || !TARGET_LAST_NAME || !TARGET_PASSWORD) {
    throw new Error('ADMIN_EMAIL, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, and ADMIN_PASSWORD are required');
  }

  await connect();

  let user = await User.findOne({ email: TARGET_EMAIL });

  if (!user) {
    user = await User.create({
      firstName: TARGET_FIRST_NAME,
      lastName: TARGET_LAST_NAME,
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      role: 'admin',
      isActive: true,
      department: 'Administration',
      position: 'System Administrator',
    });
    logger.info(`Created admin user: ${user.email}`);
  } else {
    user.firstName = TARGET_FIRST_NAME;
    user.lastName = TARGET_LAST_NAME;
    user.role = 'admin';
    user.isActive = true;
    user.department = user.department || 'Administration';
    user.position = user.position || 'System Administrator';
    await user.save();
    logger.info(`Promoted existing user to admin: ${user.email}`);
  }

  let employee = await Employee.findOne({ user: user._id });
  if (!employee) {
    employee = await Employee.create({
      user: user._id,
      employeeId: generateEmployeeId(),
      hireDate: new Date(),
      employmentType: 'full-time',
      status: 'active',
      skills: ['Leadership', 'Operations', 'System Administration'],
    });
    logger.info(`Created employee profile: ${employee.employeeId}`);
  } else {
    employee.status = 'active';
    await employee.save();
    logger.info(`Refreshed employee profile: ${employee.employeeId}`);
  }

  return { user, employee };
};

if (require.main === module) {
  upsertAdmin()
    .then(async ({ user, employee }) => {
      logger.info(`Done: ${user.email} is admin with employee profile ${employee.employeeId}`);
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch(async (error) => {
      logger.error(`Failed to create admin user: ${error.message}`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      process.exit(1);
    });
}

module.exports = upsertAdmin;
