require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const http = require('http');
const socketIO = require('socket.io');

// Import configurations
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./config/logger');

// Import middleware
const errorHandler = require('./middleware/error');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const employeeRoutes = require('./routes/employees');
const shiftRoutes = require('./routes/shifts');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const swapRoutes = require('./routes/swaps');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Import job processors
require('./jobs/emailProcessor');
require('./jobs/reportProcessor');
require('./jobs/reminderProcessor');
require('./jobs/notificationProcessor');

// Import cron jobs
if (process.env.ENABLE_CRON_JOBS === 'true') {
  require('./jobs/cronJobs');
}

// Initialize express app
const app = express();
const server = http.createServer(app);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname);
  } catch (error) {
    return false;
  }
};

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || /^(http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+)$/,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (userId) => {
    const roomName = typeof userId === 'string' && (userId.startsWith('user-') || userId.startsWith('department-') || userId.startsWith('role-'))
      ? userId
      : `user-${userId}`;

    socket.join(roomName);
    logger.info(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to database
connectDB().then(async () => {
  // Seed database with initial data
  const seedDatabase = require('./utils/seed');
  try {
    await seedDatabase();
  } catch (error) {
    logger.error(`Failed to seed database: ${error.message}`);
  }
});
connectRedis();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true,
}));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Sanitize data
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/employees`, employeeRoutes);
app.use(`/api/${API_VERSION}/shifts`, shiftRoutes);
app.use(`/api/${API_VERSION}/attendance`, attendanceRoutes);
app.use(`/api/${API_VERSION}/leaves`, leaveRoutes);
app.use(`/api/${API_VERSION}/swaps`, swapRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
