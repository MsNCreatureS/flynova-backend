const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/logos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'va-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all Virtual Airlines
router.get('/', async (req, res) => {
  try {
    const [vas] = await db.query(`
      SELECT 
        va.*,
        u.username as owner_username,
        COUNT(DISTINCT vm.user_id) as member_count
      FROM virtual_airlines va
      LEFT JOIN users u ON va.owner_id = u.id
      LEFT JOIN va_members vm ON va.id = vm.va_id AND vm.status = 'active'
      WHERE va.status = 'active'
      GROUP BY va.id
      ORDER BY va.created_at DESC
    `);

    res.json({ virtualAirlines: vas });
  } catch (error) {
    console.error('Get VAs error:', error);
    res.status(500).json({ error: 'Failed to fetch virtual airlines' });
  }
});

// Create Virtual Airline
router.post('/', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const { 
      name, 
      callsign, 
      icao_code, 
      iata_code, 
      description, 
      website,
      contact_email,
      contact_discord,
      contact_other,
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      text_on_primary
    } = req.body;
    const userId = req.user.id;

    // Check if user already owns a VA
    const [existing] = await db.query(
      'SELECT id FROM virtual_airlines WHERE owner_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You can only create one Virtual Airline' });
    }

    // Check if callsign is taken
    const [callsignCheck] = await db.query(
      'SELECT id FROM virtual_airlines WHERE callsign = ?',
      [callsign]
    );

    if (callsignCheck.length > 0) {
      return res.status(400).json({ error: 'Callsign already taken' });
    }

    // Determine logo URL (uploaded file or external URL)
    let finalLogoUrl = logo_url || null;
    if (req.file) {
      finalLogoUrl = '/uploads/logos/' + req.file.filename;
    }

    // Create VA with branding colors and contact info
    const [result] = await db.query(
      `INSERT INTO virtual_airlines 
      (name, callsign, icao_code, iata_code, owner_id, description, website, logo_url,
       contact_email, contact_discord, contact_other,
       primary_color, secondary_color, accent_color, text_on_primary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        callsign, 
        icao_code || null, 
        iata_code || null, 
        userId, 
        description || null, 
        website || null, 
        finalLogoUrl,
        contact_email || null,
        contact_discord || null,
        contact_other || null,
        primary_color || '#00c853',
        secondary_color || '#00a843',
        accent_color || '#00ff7f',
        text_on_primary || '#ffffff'
      ]
    );

    const vaId = result.insertId;

    // Add owner as member with owner role
    await db.query(
      'INSERT INTO va_members (user_id, va_id, role) VALUES (?, ?, ?)',
      [userId, vaId, 'Owner']
    );

    res.status(201).json({
      message: 'Virtual Airline created successfully',
      virtualAirline: {
        id: vaId,
        name,
        callsign,
        icao_code,
        iata_code,
        logo_url: finalLogoUrl
      }
    });
  } catch (error) {
    console.error('Create VA error:', error);
    res.status(500).json({ error: 'Failed to create Virtual Airline' });
  }
});

// Get VA details with branding
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [vas] = await db.query(`
      SELECT 
        va.*,
        COALESCE(va.primary_color, '#00c853') as primary_color,
        COALESCE(va.secondary_color, '#00a843') as secondary_color,
        COALESCE(va.accent_color, '#00ff7f') as accent_color,
        COALESCE(va.text_on_primary, '#ffffff') as text_on_primary,
        u.username as owner_username,
        COUNT(DISTINCT vm.user_id) as member_count,
        COUNT(DISTINCT f.id) as total_flights,
        SUM(CASE WHEN vm.status = 'active' THEN vm.total_hours ELSE 0 END) as total_hours
      FROM virtual_airlines va
      LEFT JOIN users u ON va.owner_id = u.id
      LEFT JOIN va_members vm ON va.id = vm.va_id
      LEFT JOIN flights f ON va.id = f.va_id AND f.status = 'completed'
      WHERE va.id = ?
      GROUP BY va.id
    `, [vaId]);

    if (vas.length === 0) {
      return res.status(404).json({ error: 'Virtual Airline not found' });
    }

    // Get members list
    const [members] = await db.query(`
      SELECT 
        vm.user_id,
        u.username,
        u.avatar_url,
        vm.role,
        vm.points,
        vm.total_flights,
        vm.total_hours,
        vm.join_date as joined_at,
        vm.status
      FROM va_members vm
      JOIN users u ON vm.user_id = u.id
      WHERE vm.va_id = ?
      ORDER BY 
        CASE vm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        vm.points DESC
    `, [vaId]);

    res.json({ 
      virtualAirline: vas[0],
      members: members
    });
  } catch (error) {
    console.error('Get VA error:', error);
    res.status(500).json({ error: 'Failed to fetch Virtual Airline' });
  }
});

// Join VA
router.post('/:vaId/join', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    // Check if VA exists
    const [vas] = await db.query('SELECT id FROM virtual_airlines WHERE id = ?', [vaId]);
    if (vas.length === 0) {
      return res.status(404).json({ error: 'Virtual Airline not found' });
    }

    // Check if already an active member
    const [existing] = await db.query(
      'SELECT id FROM va_members WHERE user_id = ? AND va_id = ? AND status = ?',
      [userId, vaId, 'active']
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already a member of this VA' });
    }

    // Add member (or re-add if they left before)
    await db.query(
      'INSERT INTO va_members (user_id, va_id, role) VALUES (?, ?, ?)',
      [userId, vaId, 'Member']
    );

    res.status(201).json({ message: 'Successfully joined Virtual Airline' });
  } catch (error) {
    console.error('Join VA error:', error);
    res.status(500).json({ error: 'Failed to join Virtual Airline' });
  }
});

// Get VA leaderboard
router.get('/:vaId/leaderboard', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [leaderboard] = await db.query(`
      SELECT 
        vm.user_id,
        u.username,
        u.avatar_url,
        vm.points,
        vm.total_flights,
        vm.total_hours,
        vm.join_date
      FROM va_members vm
      JOIN users u ON vm.user_id = u.id
      WHERE vm.va_id = ? AND vm.status = 'active'
      ORDER BY vm.points DESC, vm.total_hours DESC
      LIMIT 100
    `, [vaId]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Update VA (admin only)
router.put('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), upload.single('logo'), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { name, description, website, contact_email, contact_discord, contact_other, logo_url } = req.body;

    // Build update query dynamically based on what's provided
    let updateFields = [];
    let updateValues = [];

    // Always update these fields
    updateFields.push('name = ?', 'description = ?', 'website = ?', 'contact_email = ?', 'contact_discord = ?', 'contact_other = ?');
    updateValues.push(name, description, website, contact_email, contact_discord, contact_other);

    // Only update logo if a new one is provided
    if (req.file) {
      updateFields.push('logo_url = ?');
      updateValues.push('/uploads/logos/' + req.file.filename);
    } else if (logo_url) {
      updateFields.push('logo_url = ?');
      updateValues.push(logo_url);
    }

    // Add vaId to the end of values array
    updateValues.push(vaId);

    await db.query(
      `UPDATE virtual_airlines SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Virtual Airline updated successfully' });
  } catch (error) {
    console.error('Update VA error:', error);
    res.status(500).json({ error: 'Failed to update Virtual Airline' });
  }
});

// Get VA members (for management page)
router.get('/:vaId/members', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;

    const [members] = await db.query(`
      SELECT 
        vm.id,
        vm.user_id,
        u.username,
        u.email,
        vm.role,
        vm.points,
        vm.total_flights,
        vm.total_hours,
        vm.join_date,
        vm.status
      FROM va_members vm
      JOIN users u ON vm.user_id = u.id
      WHERE vm.va_id = ? AND vm.status = 'active'
      ORDER BY 
        CASE vm.role 
          WHEN 'Owner' THEN 1 
          WHEN 'Admin' THEN 2
          WHEN 'Pilot' THEN 3
          ELSE 4
        END,
        vm.points DESC
    `, [vaId]);

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update member role (owner/admin only)
router.put('/:vaId/members/:memberId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, memberId } = req.params;
    const { role } = req.body;

    // Prevent changing owner role
    const [member] = await db.query(
      'SELECT role FROM va_members WHERE id = ? AND va_id = ?',
      [memberId, vaId]
    );

    if (member.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member[0].role === 'Owner') {
      return res.status(403).json({ error: 'Cannot change owner role' });
    }

    // Only owner can set admin role
    if (role === 'Admin' && req.vaRole !== 'Owner') {
      return res.status(403).json({ error: 'Only owner can assign admin role' });
    }

    await db.query(
      'UPDATE va_members SET role = ? WHERE id = ? AND va_id = ?',
      [role, memberId, vaId]
    );

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Remove member (owner/admin only)
router.delete('/:vaId/members/:memberId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, memberId } = req.params;

    // Prevent removing owner
    const [member] = await db.query(
      'SELECT role FROM va_members WHERE id = ? AND va_id = ?',
      [memberId, vaId]
    );

    if (member.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member[0].role === 'Owner') {
      return res.status(403).json({ error: 'Cannot remove owner' });
    }

    await db.query(
      'UPDATE va_members SET status = ? WHERE id = ? AND va_id = ?',
      ['left', memberId, vaId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get my stats for a VA
router.get('/:vaId/my-stats', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    console.log('Fetching stats for user:', userId, 'in VA:', vaId); // Debug

    // Get member stats with fixed subquery
    const [member] = await db.query(`
      SELECT 
        vm.points,
        vm.total_flights,
        vm.total_hours,
        (SELECT COUNT(*) + 1 FROM va_members vm2
         WHERE vm2.va_id = vm.va_id AND vm2.points > vm.points AND vm2.status = 'active') as \`rank\`
      FROM va_members vm
      WHERE vm.user_id = ? AND vm.va_id = ? AND vm.status = 'active'
    `, [userId, vaId]);

    console.log('Member stats result:', member); // Debug

    if (member.length === 0) {
      console.log('No member found, returning default stats'); // Debug
      return res.json({ 
        stats: {
          total_flights: 0,
          total_hours: 0,
          points: 0,
          rank: null
        }
      });
    }

    res.json({ stats: member[0] });
  } catch (error) {
    console.error('Get my stats error:', error);
    console.error('Error details:', error.message); // Debug
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// Leave VA (for Admin, Member, Pilot - not Owner)
router.post('/:vaId/leave', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const [member] = await db.query(
      'SELECT id, role FROM va_members WHERE user_id = ? AND va_id = ? AND status = ?',
      [userId, vaId, 'active']
    );

    if (member.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this VA' });
    }

    // Prevent owner from leaving (they must delete the VA instead)
    if (member[0].role === 'Owner') {
      return res.status(403).json({ error: 'Owner cannot leave the VA. Delete the VA instead.' });
    }

    // Delete member completely so they can rejoin later
    await db.query(
      'DELETE FROM va_members WHERE id = ?',
      [member[0].id]
    );

    res.json({ message: 'Successfully left the Virtual Airline' });
  } catch (error) {
    console.error('Leave VA error:', error);
    res.status(500).json({ error: 'Failed to leave Virtual Airline' });
  }
});

// Delete VA (Owner only)
router.delete('/:vaId', authMiddleware, checkVARole(['Owner']), async (req, res) => {
  try {
    const { vaId } = req.params;

    // Delete the VA (CASCADE will handle related tables)
    await db.query('DELETE FROM virtual_airlines WHERE id = ?', [vaId]);

    res.json({ message: 'Virtual Airline deleted successfully' });
  } catch (error) {
    console.error('Delete VA error:', error);
    res.status(500).json({ error: 'Failed to delete Virtual Airline' });
  }
});

module.exports = router;
