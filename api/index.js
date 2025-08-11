const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('../server/database/mongodb');
const authRoutes = require('../server/routes/auth');
const usersRoutes = require('../server/routes/users');
const { authenticateToken } = require('../server/middleware/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  }
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return req.ip + ':auth';
  }
});
app.use('/api/auth/', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

const indexRoutes = require('../server/routes/index');
app.use('/api/index', indexRoutes);

const marketingRoutes = require('../server/routes/marketing');
app.use('/api/marketing', marketingRoutes);

const dashboardRoutes = require('../server/routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

const ordersRoutes = require('../server/routes/orders');
app.use('/api/orders', ordersRoutes);

const analyticsRoutes = require('../server/routes/analytics');
app.use('/api/analytics', analyticsRoutes);

const teamRoutes = require('../server/routes/team');
app.use('/api/team', teamRoutes);

const financeRoutes = require('../server/routes/finance');
app.use('/api/finance', financeRoutes);

const appsRoutes = require('../server/routes/apps');
app.use('/api/apps', appsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Access granted to protected route',
    user: req.user
  });
});

// Serve static files for non-API routes
app.use(express.static(path.join(__dirname, '..')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize MongoDB connection
(async () => {
  try {
    await connectDB();
    console.log('MongoDB connection initialized for Vercel');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
})();

module.exports = app;