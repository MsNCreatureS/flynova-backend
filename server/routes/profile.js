const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const [users] = await db.query(
      'SELECT id, username, email, first_name, last_name, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get VA memberships
    const [memberships] = await db.query(`
      SELECT 
        vm.*,
        va.name as va_name,
        va.callsign as va_callsign,
        va.logo_url as va_logo_url,
        (SELECT COUNT(*) FROM va_members WHERE va_id = vm.va_id AND status = 'active') as member_count
      FROM va_members vm
      JOIN virtual_airlines va ON vm.va_id = va.id
      WHERE vm.user_id = ? AND vm.status = 'active'
      ORDER BY vm.join_date DESC
    `, [userId]);

    // Get total stats across all VAs
    const [stats] = await db.query(`
      SELECT 
        SUM(total_flights) as total_flights,
        SUM(total_hours) as total_hours,
        SUM(points) as total_points
      FROM va_members
      WHERE user_id = ? AND status = 'active'
    `, [userId]);

    // Get recent flights
    const [recentFlights] = await db.query(`
      SELECT 
        f.*,
        va.name as va_name,
        vr.flight_number,
        vr.departure_icao,
        vr.arrival_icao,
        fr.validation_status,
        fr.points_awarded
      FROM flights f
      JOIN virtual_airlines va ON f.va_id = va.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN flight_reports fr ON f.id = fr.flight_id
      WHERE f.user_id = ? AND f.status = 'completed'
      ORDER BY f.arrival_time DESC
      LIMIT 10
    `, [userId]);

    // Get achievements
    const [achievements] = await db.query(`
      SELECT 
        ua.*,
        a.name,
        a.description,
        a.icon,
        a.points,
        a.badge_color,
        va.name as va_name
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      LEFT JOIN virtual_airlines va ON ua.va_id = va.id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `, [userId]);

    res.json({
      user,
      memberships,
      stats: stats[0],
      recentFlights,
      achievements
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, avatar_url } = req.body;

    // Determine avatar URL (uploaded file or external URL)
    let finalAvatarUrl = avatar_url || null;
    if (req.file) {
      finalAvatarUrl = '/uploads/avatars/' + req.file.filename;
    }

    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ? WHERE id = ?',
      [first_name || null, last_name || null, finalAvatarUrl, userId]
    );

    // Get updated user data
    const [users] = await db.query(
      'SELECT id, username, email, first_name, last_name, avatar_url FROM users WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
