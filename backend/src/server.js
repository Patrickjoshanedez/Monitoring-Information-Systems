require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const helmet = require('helmet');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`API running on :${port}`));
};

start();


