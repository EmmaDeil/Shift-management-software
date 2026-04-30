const Bull = require('bull');
const logger = require('./logger');

const isFeatureEnabled = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
};

const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  },
};

const createNoopQueue = (name) => ({
  on: () => {},
  process: () => {
    logger.warn(`${name} queue processor skipped because queues are disabled`);
  },
  add: async (data) => {
    logger.warn(`${name} queue add skipped because queues are disabled`);
    return { id: `noop-${Date.now()}`, data };
  },
});

const queuesEnabled = isFeatureEnabled(process.env.ENABLE_QUEUES, false);

// Create queues
const emailQueue = queuesEnabled ? new Bull('email', queueOptions) : createNoopQueue('Email');

const reportQueue = queuesEnabled ? new Bull('report', queueOptions) : createNoopQueue('Report');

const reminderQueue = queuesEnabled ? new Bull('reminder', queueOptions) : createNoopQueue('Reminder');

const notificationQueue = queuesEnabled
  ? new Bull('notification', queueOptions)
  : createNoopQueue('Notification');

// Queue event handlers
const setupQueueEvents = (queue, queueName) => {
  queue.on('completed', (job, result) => {
    logger.info(`${queueName} job ${job.id} completed with result: ${result}`);
  });

  queue.on('failed', (job, err) => {
    logger.error(`${queueName} job ${job.id} failed with error: ${err.message}`);
  });

  queue.on('stalled', (job) => {
    logger.warn(`${queueName} job ${job.id} stalled`);
  });

  queue.on('error', (error) => {
    logger.error(`${queueName} queue error: ${error.message}`);
  });
};

// Setup event handlers for all queues
if (queuesEnabled) {
  setupQueueEvents(emailQueue, 'Email');
  setupQueueEvents(reportQueue, 'Report');
  setupQueueEvents(reminderQueue, 'Reminder');
  setupQueueEvents(notificationQueue, 'Notification');
  logger.info('Background queues enabled');
} else {
  logger.warn('Background queues are disabled via ENABLE_QUEUES=false');
}

module.exports = {
  emailQueue,
  reportQueue,
  reminderQueue,
  notificationQueue,
};
