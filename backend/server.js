/**
 * LocalLink — Backend Server
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const connectDB      = require('./config/database');
const errorHandler   = require('./middleware/errorHandler');
const cronJobs       = require('./services/cronJobs');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const categoryRoutes   = require('./routes/categories');
const reviewRoutes     = require('./routes/reviews');
const adminRoutes      = require('./routes/admin');
const paymentRoutes    = require('./routes/payments');
const userRoutes       = require('./routes/users');

const app = express();

connectDB();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE'],
}));

// Global rate limit: 300 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, uptime: process.uptime(), env: process.env.NODE_ENV })
);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/users',       userRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Cron jobs ────────────────────────────────────────────────────────────────
cronJobs.startAll();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  LocalLink API  →  http://localhost:${PORT}`);
  console.log(`    Mode    : ${process.env.NODE_ENV || 'development'}`);
  console.log(`    Dev OTP : ${process.env.DEV_OTP === 'true' ? 'ON (console)' : 'OFF (Twilio)'}\n`);
});

module.exports = app;
