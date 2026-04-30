const User = require('../models/User');
const Employee = require('../models/Employee');
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

const seedDatabase = async () => {
  try {
    const usersToSeed = [
      {
        email: 'admin@shiftflow.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '+1234567890',
        department: 'Administration',
        position: 'System Administrator',
        employeeId: 'ADM001',
        hireDate: new Date('2023-01-01'),
        hourlyRate: 45,
        skills: ['Leadership', 'Operations', 'System Administration'],
      },
      {
        email: 'manager@shiftflow.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'manager',
        phone: '+1234567891',
        department: 'Operations',
        position: 'Operations Manager',
        employeeId: 'MGR001',
        hireDate: new Date('2023-01-05'),
        hourlyRate: 38,
        skills: ['Leadership', 'Scheduling', 'Team Coordination'],
      },
      {
        email: 'employee@shiftflow.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'employee',
        phone: '+1234567892',
        department: 'Sales',
        position: 'Sales Associate',
        employeeId: 'EMP001',
        hireDate: new Date('2023-01-15'),
        hourlyRate: 25,
        skills: ['Customer Service', 'Sales', 'Communication'],
      },
    ];

    for (const seedUser of usersToSeed) {
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

        logger.info(`${seedUser.role} user created: ${user.email}`);
      }

      const employeeExists = await Employee.findOne({ user: user._id });

      if (!employeeExists) {
        const employee = await Employee.create({
          user: user._id,
          employeeId: seedUser.employeeId,
          hireDate: seedUser.hireDate,
          employmentType: 'full-time',
          status: 'active',
          hourlyRate: seedUser.hourlyRate,
          skills: seedUser.skills,
          availability: defaultAvailability,
        });

        logger.info(`Employee profile created: ${employee.employeeId}`);
      }
    }

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
