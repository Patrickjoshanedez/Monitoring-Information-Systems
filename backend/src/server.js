require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const helmet = require('helmet');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
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

// Silence .well-known 404s for devtools/chrome probes
app.use('/.well-known', (req, res) => {
  res.status(204).send();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/applicationRoutes'));
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api', require('./routes/profileRoutes'));
app.use('/api', require('./routes/sessionRoutes'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Global error handler to ensure JSON responses (e.g., multer/file upload errors)
// Must come after routes and static handlers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Basic content negotiation: default to JSON
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  return res.status(status).json({ success: false, error: 'SERVER_ERROR', message });
});

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`API running on :${port}`));
};

start();


