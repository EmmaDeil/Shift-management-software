const logger = require('../config/logger');

const seedData = async () => {
  logger.info('Seeding is disabled in this repository. No sample data is bundled.');
  return {
    users: 0,
    employees: 0,
    shifts: 0,
    attendance: 0,
    leaves: 0,
    swaps: 0,
    notifications: 0,
  };
};

const runSeed = async () => {
  const closeConnection = require.main === module;

  try {
    const summary = await seedData();
    logger.info('No seed records were created.');
    return summary;
  } finally {
    if (closeConnection && process.env.MONGODB_URI) {
      process.exit(0);
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
