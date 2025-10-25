const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, checkSuperAdmin } = require('../middleware/auth');

// Apply auth and super admin check to all routes
router.use(authMiddleware);
router.use(checkSuperAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total VAs
    const [vaCount] = await db.query('SELECT COUNT(*) as count FROM virtual_airlines');
    
    // Total Users
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Total Flights
    const [flightCount] = await db.query('SELECT COUNT(*) as count FROM flights');
    
    // Completed Flights
    const [completedCount] = await db.query(
      'SELECT COUNT(*) as count FROM flights WHERE status = "completed"'
    );

    // Active VAs (with at least one member)
    const [activeVAs] = await db.query(`
      SELECT COUNT(DISTINCT va_id) as count 
      FROM va_members 
      WHERE status = 'active'
    `);

    // Recent registrations (last 7 days)
    const [recentUsers] = await db.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      totalVAs: vaCount[0].count,
      totalUsers: userCount[0].count,
      totalFlights: flightCount[0].count,
      completedFlights: completedCount[0].count,
      activeVAs: activeVAs[0].count,
      recentUsers: recentUsers[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all Virtual Airlines with details
router.get('/virtual-airlines', async (req, res) => {
  try {
    const [vas] = await db.query(`
      SELECT 
        va.id,
        va.name,
        va.callsign,
        va.icao_code,
        va.iata_code,
        va.status,
        va.created_at,
        va.logo_url,
        u.username as owner_username,
        u.email as owner_email,
        COUNT(DISTINCT vm.user_id) as member_count,
        COUNT(DISTINCT f.id) as total_flights
      FROM virtual_airlines va
      LEFT JOIN users u ON va.owner_id = u.id
      LEFT JOIN va_members vm ON va.id = vm.va_id AND vm.status = 'active'
      LEFT JOIN flights f ON va.id = f.va_id
      GROUP BY va.id
      ORDER BY va.created_at DESC
    `);

    res.json({ virtualAirlines: vas });
  } catch (error) {
    console.error('Error fetching VAs:', error);
    res.status(500).json({ error: 'Failed to fetch virtual airlines' });
  }
});

// Get all users with details
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.status,
        u.is_super_admin,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT vm.va_id) as va_count,
        COUNT(DISTINCT f.id) as flight_count
      FROM users u
      LEFT JOIN va_members vm ON u.id = vm.user_id AND vm.status = 'active'
      LEFT JOIN flights f ON u.id = f.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Suspend/Activate Virtual Airline
router.put('/virtual-airlines/:vaId/status', async (req, res) => {
  try {
    const { vaId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.query(
      'UPDATE virtual_airlines SET status = ? WHERE id = ?',
      [status, vaId]
    );

    res.json({ message: 'VA status updated successfully' });
  } catch (error) {
    console.error('Error updating VA status:', error);
    res.status(500).json({ error: 'Failed to update VA status' });
  }
});

// Delete Virtual Airline (with cascade)
router.delete('/virtual-airlines/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    await db.query('DELETE FROM virtual_airlines WHERE id = ?', [vaId]);

    res.json({ message: 'VA deleted successfully' });
  } catch (error) {
    console.error('Error deleting VA:', error);
    res.status(500).json({ error: 'Failed to delete VA' });
  }
});

// Suspend/Activate User
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Prevent super admin from suspending themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own status' });
    }

    await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete User
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent super admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user is owner of any VA
    const [vas] = await db.query(
      'SELECT id FROM virtual_airlines WHERE owner_id = ?',
      [userId]
    );

    if (vas.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user who owns Virtual Airlines. Delete or transfer ownership first.' 
      });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const [activities] = await db.query(`
      (SELECT 
        'va_created' as type,
        va.id as entity_id,
        va.name as entity_name,
        u.username,
        va.created_at as timestamp
      FROM virtual_airlines va
      JOIN users u ON va.owner_id = u.id
      ORDER BY va.created_at DESC
      LIMIT 10)
      
      UNION ALL
      
      (SELECT 
        'user_registered' as type,
        u.id as entity_id,
        u.username as entity_name,
        u.username,
        u.created_at as timestamp
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 10)
      
      UNION ALL
      
      (SELECT 
        'flight_completed' as type,
        f.id as entity_id,
        f.flight_number as entity_name,
        u.username,
        f.arrival_time as timestamp
      FROM flights f
      JOIN users u ON f.user_id = u.id
      WHERE f.status = 'completed' AND f.arrival_time IS NOT NULL
      ORDER BY f.arrival_time DESC
      LIMIT 10)
      
      ORDER BY timestamp DESC
      LIMIT 30
    `);

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

module.exports = router;
