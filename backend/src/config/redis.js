const redis = require('redis');
const logger = require('./logger');

let redisClient;

const isFeatureEnabled = (value, defaultValue = true) => {
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
};

const connectRedis = async () => {
  if (!isFeatureEnabled(process.env.ENABLE_REDIS, false)) {
    logger.warn('Redis is disabled via ENABLE_REDIS=false');
    return null;
  }

  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            return false;
          }
          return (retries + 1) * 250;
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
      legacyMode: false,
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message || err}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis Client Disconnected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.warn(`Redis unavailable, continuing without cache/queues: ${error.message}`);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
