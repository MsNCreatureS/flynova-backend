const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { uploadAvatarMiddleware } = require('../middleware/upload');

const router = express.Router();

// Get current user profile (authenticated)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

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

    res.json({
      user,
      memberships,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user profile by ID
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
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Accepter à la fois camelCase (firstName) et snake_case (first_name)
    const first_name = req.body.first_name ?? req.body.firstName;
    const last_name = req.body.last_name ?? req.body.lastName;
    const avatar_url = req.body.avatar_url ?? req.body.avatarUrl;
    const simbrief_username = req.body.simbrief_username ?? req.body.simbriefUsername;

    console.log('PUT /api/profile/me - Body received:', req.body);
    console.log('Parsed values:', { first_name, last_name, avatar_url, simbrief_username });

    // Construire la requête UPDATE dynamiquement
    const updates = [];
    const values = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name || null);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name || null);
    }

    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url || null);
    }

    if (simbrief_username !== undefined) {
      updates.push('simbrief_username = ?');
      values.push(simbrief_username || null);
    }

    // Si aucune mise à jour
    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update',
        received: req.body,
        hint: 'Send firstName, lastName, avatarUrl, or simbriefUsername'
      });
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user data
    const [users] = await db.query(
      'SELECT id, username, email, first_name, last_name, avatar_url, simbrief_username FROM users WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Upload avatar (separate route for file upload)
router.post('/avatar', authMiddleware, uploadAvatarMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('POST /api/profile/avatar - Request received');
    console.log('- User ID:', userId);
    console.log('- File received:', req.file ? 'Yes' : 'No');
    console.log('- Files object:', req.files);
    console.log('- Body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        hint: 'Send a file with field name "avatar"',
        received: {
          files: req.files,
          body: req.body
        }
      });
    }

    // Hostinger FTP URL is in req.file.path
    const avatarUrl = req.file.path;

    console.log('- Avatar URL from FTP:', avatarUrl);

    // Update user avatar
    await db.query(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
  }
});

module.exports = router;
