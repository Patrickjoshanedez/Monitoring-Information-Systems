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

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      appName: process.env.APP_NAME || 'MentoringSystem',
    });
  } catch (err) {
    // Sanitize driver details
    logger.error('MongoDB connection failed:', err?.message || err);
    process.exit(1);
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`API running on :${port}`);
    startSessionReminderWorker();
    startFeedbackRetentionWorker();
  });
};

start();


