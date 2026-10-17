const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const projectRoutes = require('./routes/projectRoutes');
const memberRoutes = require('./routes/memberRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/accesshub';
const SESSION_SECRET = process.env.SESSION_SECRET || 'accesshub_default_secret_key_2026';

// Connect to MongoDB
connectDB();

// Security: Helmet with cross-origin resource policy enabled for static uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Security: CORS configuration with credentials for session cookies
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder for profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security: Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// Specific stricter limiter for login/registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 attempts per 15 min
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Session configuration with MongoDB store
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60, // 7 days
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'AccessHub API',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🚀 AccessHub Server running on http://localhost:${PORT}`);
  console.log(`🌐 Allowed Client: ${CLIENT_URL}`);
  console.log(`📁 Database: ${MONGO_URI}`);
  console.log(`==========================================`);
});
