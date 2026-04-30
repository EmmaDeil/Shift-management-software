const cron = require('node-cron');
const logger = require('../config/logger');

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

logger.info('Cron jobs initialized');
