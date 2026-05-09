const cron = require('node-cron');
const logger = require('../config/logger');
const { generateMonthlyRoster } = require('./monthlyRosterGenerator');

// Send shift reminders every hour
cron.schedule('0 * * * *', () => {
  logger.info('Running shift reminder job');
  // Implementation will be added here
});

// Generate daily attendance summary at midnight
cron.schedule('0 0 * * *', () => {
  logger.info('Running daily attendance summary job');
  // Implementation will be added here
});

// Clean up old notifications weekly
cron.schedule('0 0 * * 0', () => {
  logger.info('Running cleanup job for old notifications');
  // Implementation will be added here
});

// Generate monthly roster on the first day of every month
cron.schedule(
  process.env.AUTO_ROSTER_CRON || '5 0 1 * *',
  async () => {
    logger.info('Running monthly roster generation job');
    try {
      await generateMonthlyRoster();
    } catch (error) {
      logger.error(`Monthly roster generation failed: ${error.message}`);
    }
  },
  {
    timezone: process.env.AUTO_ROSTER_TIMEZONE || 'UTC',
  }
);

// Optional one-time startup generation for the current month
if (String(process.env.AUTO_ROSTER_GENERATE_ON_START || 'false').toLowerCase() === 'true') {
  generateMonthlyRoster()
    .then((result) => {
      logger.info(`Startup monthly roster generation completed for ${result.cycleKey}`);
    })
    .catch((error) => {
      logger.error(`Startup monthly roster generation failed: ${error.message}`);
    });
}

logger.info('Cron jobs initialized');
