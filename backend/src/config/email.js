const nodemailer = require('nodemailer');
const logger = require('./logger');

const hasRealEmailCredentials =
  process.env.EMAIL_USER
  && process.env.EMAIL_PASSWORD
  && process.env.EMAIL_USER !== 'your_email_user'
  && process.env.EMAIL_PASSWORD !== 'your_email_password';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: hasRealEmailCredentials
    ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    }
    : undefined,
});

// Verify transporter configuration
if (hasRealEmailCredentials) {
  transporter.verify((error) => {
    if (error) {
      logger.error(`Email transporter verification failed: ${error.message}`);
    } else {
      logger.info('Email transporter is ready to send messages');
    }
  });
} else {
  logger.warn('SMTP verification skipped because EMAIL_USER/EMAIL_PASSWORD are placeholders');
}

module.exports = transporter;
