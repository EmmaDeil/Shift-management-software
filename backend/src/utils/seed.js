const User = require('../models/User');
const Employee = require('../models/Employee');
const logger = require('../config/logger');

const seedDatabase = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@shiftflow.com' });
    
    if (adminExists) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shiftflow.com',
      password: 'password',
      role: 'admin',
      phone: '+1234567890',
      department: 'Administration',
      position: 'System Administrator',
      isActive: true,
    });

    logger.info(`Admin user created: ${adminUser.email}`);

    // Create manager user
    const managerUser = await User.create({
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@shiftflow.com',
      password: 'password',
      role: 'manager',
      phone: '+1234567891',
      department: 'Operations',
      position: 'Operations Manager',
      isActive: true,
    });

    logger.info(`Manager user created: ${managerUser.email}`);

    // Create employee user
    const employeeUser = await User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'employee@shiftflow.com',
      password: 'password',
      role: 'employee',
      phone: '+1234567892',
      department: 'Sales',
      position: 'Sales Associate',
      isActive: true,
    });

    logger.info(`Employee user created: ${employeeUser.email}`);

    // Create employee profiles
    const employee1 = await Employee.create({
      user: employeeUser._id,
      employeeId: 'EMP001',
      hireDate: new Date('2023-01-15'),
      employmentType: 'full-time',
      status: 'active',
      hourlyRate: 25.0,
      skills: ['Customer Service', 'Sales', 'Communication'],
      availability: {
        monday: { available: true, start: '09:00', end: '17:00' },
        tuesday: { available: true, start: '09:00', end: '17:00' },
        wednesday: { available: true, start: '09:00', end: '17:00' },
        thursday: { available: true, start: '09:00', end: '17:00' },
        friday: { available: true, start: '09:00', end: '17:00' },
        saturday: { available: false },
        sunday: { available: false },
      },
    });

    logger.info(`Employee profile created: ${employee1.employeeId}`);

    logger.info('✅ Database seeded successfully!');
    logger.info('Login credentials:');
    logger.info('  Admin: admin@shiftflow.com / password');
    logger.info('  Manager: manager@shiftflow.com / password');
    logger.info('  Employee: employee@shiftflow.com / password');

  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    throw error;
  }
};

module.exports = seedDatabase;
