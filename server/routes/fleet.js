const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');

const router = express.Router();

// Get VA fleet
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [fleet] = await db.query(`
      SELECT *
      FROM va_fleet
      WHERE va_id = ?
      ORDER BY aircraft_type, registration
    `, [vaId]);

    res.json({ fleet });
  } catch (error) {
    console.error('Get fleet error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet' });
  }
});

// Add aircraft to fleet (admin only)
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { registration, aircraft_type, aircraft_name, home_airport, notes } = req.body;

    // Check if registration already exists in this VA
    const [existing] = await db.query(
      'SELECT id FROM va_fleet WHERE va_id = ? AND registration = ?',
      [vaId, registration]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Registration already exists in fleet' });
    }

    const [result] = await db.query(
      'INSERT INTO va_fleet (va_id, registration, aircraft_type, aircraft_name, home_airport, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [vaId, registration, aircraft_type, aircraft_name, home_airport || null, notes || null]
    );

    res.status(201).json({
      message: 'Aircraft added to fleet',
      fleetId: result.insertId
    });
  } catch (error) {
    console.error('Add fleet error:', error);
    res.status(500).json({ error: 'Failed to add aircraft to fleet' });
  }
});

// Update fleet aircraft (admin only)
router.put('/:vaId/:fleetId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, fleetId } = req.params;
    const { registration, aircraft_type, aircraft_name, home_airport, status, notes } = req.body;

    // Check if registration is being changed and if it already exists
    if (registration) {
      const [existing] = await db.query(
        'SELECT id FROM va_fleet WHERE va_id = ? AND registration = ? AND id != ?',
        [vaId, registration, fleetId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Registration already exists in fleet' });
      }
    }

    await db.query(
      'UPDATE va_fleet SET registration = ?, aircraft_type = ?, aircraft_name = ?, home_airport = ?, status = ?, notes = ? WHERE id = ? AND va_id = ?',
      [registration, aircraft_type, aircraft_name, home_airport, status || 'active', notes || null, fleetId, vaId]
    );

    res.json({ message: 'Fleet aircraft updated' });
  } catch (error) {
    console.error('Update fleet error:', error);
    res.status(500).json({ error: 'Failed to update fleet aircraft' });
  }
});

// Delete fleet aircraft (admin only)
router.delete('/:vaId/:fleetId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, fleetId } = req.params;

    await db.query('DELETE FROM va_fleet WHERE id = ? AND va_id = ?', [fleetId, vaId]);

    res.json({ message: 'Aircraft removed from fleet' });
  } catch (error) {
    console.error('Delete fleet error:', error);
    res.status(500).json({ error: 'Failed to remove aircraft from fleet' });
  }
});

module.exports = router;
