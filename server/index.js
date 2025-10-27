require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const vaRoutes = require('./routes/virtualAirlines');
const fleetRoutes = require('./routes/fleet');
const routeRoutes = require('./routes/routes');
const flightRoutes = require('./routes/flights');
const adminRoutes = require('./routes/admin');
const downloadsRoutes = require('./routes/downloads');
const profileRoutes = require('./routes/profile');
const dataRoutes = require('./routes/data');
const airportRoutes = require('./routes/airports');
const aircraftRoutes = require('./routes/aircraft');
const eventRoutes = require('./routes/events');
const simbriefRoutes = require('./routes/simbrief');
const acarsRoutes = require('./routes/acars');
const superAdminRoutes = require('./routes/superadmin');
const bugReportsRoutes = require('./routes/bugReports');
const cabinAnnouncementsRoutes = require('./routes/cabinAnnouncements');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - support multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview/deployment URLs
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/virtual-airlines', vaRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/aircraft', aircraftRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/simbrief', simbriefRoutes);
app.use('/api/acars', acarsRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/bug-reports', bugReportsRoutes);
app.use('/api/cabin-announcements', cabinAnnouncementsRoutes);

// API Root - Liste des endpoints disponibles
app.get('/api', (req, res) => {
  res.json({
    message: '✈️ FlyNova API - Virtual Airline Management Platform',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: {
        base: '/api/auth',
        routes: ['POST /register', 'POST /login', 'POST /forgot-password', 'POST /reset-password']
      },
      virtualAirlines: {
        base: '/api/virtual-airlines',
        routes: ['GET /', 'POST /', 'GET /:id', 'PUT /:id']
      },
      fleet: {
        base: '/api/fleet',
        routes: ['GET /:vaId', 'POST /:vaId', 'PUT /:id', 'DELETE /:id']
      },
      routes: {
        base: '/api/routes',
        routes: ['GET /:vaId', 'POST /:vaId', 'PUT /:id', 'DELETE /:id']
      },
      flights: {
        base: '/api/flights',
        routes: ['GET /:vaId', 'POST /book', 'GET /my-flights', 'POST /pirep']
      },
      admin: {
        base: '/api/admin',
        routes: ['GET /:vaId/pilots', 'PUT /:vaId/pilots/:id', 'GET /:vaId/pireps', 'PUT /:vaId/pireps/:id']
      },
      downloads: {
        base: '/api/downloads',
        routes: ['GET /', 'GET /:vaId', 'POST /:vaId', 'PUT /:id', 'DELETE /:id']
      },
      airports: {
        base: '/api/airports',
        routes: ['GET /search?q=XXX']
      },
      aircraft: {
        base: '/api/aircraft',
        routes: ['GET /search?q=XXX']
      },
      events: {
        base: '/api/events',
        routes: ['GET /', 'POST /', 'GET /:id', 'PUT /:id', 'DELETE /:id']
      },
      simbrief: {
        base: '/api/simbrief',
        routes: ['POST /generate']
      },
      acars: {
        base: '/api/acars',
        routes: ['POST /position', 'POST /telemetry']
      },
      superadmin: {
        base: '/api/superadmin',
        routes: ['GET /vas', 'PUT /vas/:id/status']
      }
    },
    documentation: 'https://github.com/MsNCreatureS/flynova-backend',
    repository: 'https://github.com/MsNCreatureS/flynova-backend'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✈️  FlyNova API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
