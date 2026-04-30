const { emailQueue } = require('../config/queue');
const transporter = require('../config/email');
const logger = require('../config/logger');

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, text, html } = job.data;

  try {
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return `Email sent successfully to ${to}`;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
});

logger.info('Email processor initialized');
