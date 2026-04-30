const AWS = require('aws-sdk');
const logger = require('./logger');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION || 'us-east-1',
});

// Create S3 instance
const s3 = new AWS.S3();

// Verify S3 configuration
const verifyS3 = async () => {
  try {
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
    logger.info('S3 bucket is accessible');
  } catch (error) {
    logger.error(`S3 bucket verification failed: ${error.message}`);
  }
};

if (process.env.NODE_ENV !== 'test') {
  verifyS3();
}

module.exports = s3;
