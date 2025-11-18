require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const passport = require('./config/passport');
const helmet = require('helmet');
const { startSessionReminderWorker } = require('./services/sessionReminderWorker');
const { startFeedbackRetentionWorker } = require('./services/feedbackRetentionWorker');
const { startMentorFeedbackAggregationWorker } = require('./services/mentorFeedbackAggregationWorker');
const compression = require('compression');

const app = express();

// Build CORS allowlist from env; supports comma-separated values
const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and any in the allowlist
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:4000", "ws://localhost:4000"], // for dev tools/hot reload
      },
    },
  })
);

// HTTP compression for JSON/text responses (minimal risk, boosts throughput)
app.use(compression());

// Silence .well-known 404s for devtools/chrome probes
app.use('/.well-known', (req, res) => {
  res.status(204).send();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/applicationRoutes'));
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/profileRoutes'));
app.use('/api', require('./routes/sessionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api', require('./routes/materialRoutes'));
app.use('/api', require('./routes/goalRoutes'));
app.use('/api', require('./routes/progressRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api', require('./routes/mentorFeedbackRoutes'));
app.use('/api', require('./routes/feedbackRoutes'));
app.use('/api', require('./routes/certificateRoutes'));
app.use('/api', require('./routes/integrationRoutes'));
app.use('/api', require('./routes/matchRoutes'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Global error handler to ensure JSON responses (e.g., multer/file upload errors)
// Must come after routes and static handlers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Basic content negotiation: default to JSON
  logger.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  return res.status(status).json({ success: false, error: 'SERVER_ERROR', message });
});

const start = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const connOptions = {
    // keep defaults but explicitly enable modern parser/topology for reliability
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    appName: process.env.APP_NAME || 'MentoringSystem',
  };

  // Enable TLS only for SRV (Atlas) URIs or when explicitly requested via env
  if (String(uri).startsWith('mongodb+srv://') || process.env.MONGODB_TLS === 'true') {
    connOptions.tls = true;
    connOptions.tlsAllowInvalidCertificates = process.env.MONGODB_TLS_ALLOW_INVALID === 'true';
  }

  // Connection event handlers for better observability
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('close', () => logger.warn('MongoDB connection closed'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error:', err && err.message ? err.message : err));

  // Retry logic with exponential backoff for transient network errors (ECONNRESET etc.)
  const maxRetries = Number(process.env.MONGODB_CONNECT_RETRIES || 5);
  const baseDelayMs = Number(process.env.MONGODB_CONNECT_BACKOFF_MS || 1000);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      attempt += 1;
      logger.info(`Attempting MongoDB connection (attempt ${attempt}/${maxRetries + 1})`);
      await mongoose.connect(uri, connOptions);
      logger.info('MongoDB connection established');
      break;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      logger.error(`MongoDB connection attempt ${attempt} failed: ${msg}`);
      // If we've exhausted retries, exit with error
      if (attempt > maxRetries) {
        logger.error('Exceeded maximum MongoDB connection attempts; exiting');
        // Give the logger a brief moment to flush
        await sleep(200);
        process.exit(1);
      }

      // If error looks like a transient network/reset issue, backoff and retry
      const isTransient = msg.includes('ECONNRESET') || msg.includes('timed out') || msg.includes('ENOTFOUND') || msg.includes('failed to connect');
      const delay = Math.min(30000, baseDelayMs * Math.pow(2, attempt - 1));
      if (!isTransient) {
        // For non-transient errors, still wait a short amount before retrying
        logger.warn('Non-transient MongoDB connect error; retrying after delay', { delay });
      } else {
        logger.warn('Transient MongoDB error; retrying after delay', { delay });
      }
      await sleep(delay);
    }
  }

  // Gracefully handle termination signals to close DB connection
  const shutdown = async (signal) => {
    try {
      logger.info(`Received ${signal}; closing MongoDB connection`);
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (closeErr) {
      logger.error('Error during MongoDB shutdown:', closeErr && closeErr.message ? closeErr.message : closeErr);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`API running on :${port}`);
    startSessionReminderWorker();
    startFeedbackRetentionWorker();
    startMentorFeedbackAggregationWorker();
  });
};

start();


