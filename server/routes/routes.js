const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');

const router = express.Router();

// Get VA routes
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [routes] = await db.query(`
      SELECT 
        vr.*
      FROM va_routes vr
      WHERE vr.va_id = ?
      ORDER BY vr.flight_number
    `, [vaId]);

    res.json({ routes });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Create route (admin only)
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { flight_number, route_type, departure_icao, departure_name, arrival_icao, arrival_name, aircraft_type } = req.body;

    // Check if flight number already exists
    const [existing] = await db.query(
      'SELECT id FROM va_routes WHERE va_id = ? AND flight_number = ?',
      [vaId, flight_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Flight number already exists' });
    }

    const [result] = await db.query(
      `INSERT INTO va_routes (va_id, flight_number, route_type, departure_icao, departure_name, arrival_icao, arrival_name, aircraft_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [vaId, flight_number, route_type || 'Civil', departure_icao, departure_name, arrival_icao, arrival_name, aircraft_type || null]
    );

    res.status(201).json({
      message: 'Route created successfully',
      routeId: result.insertId
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Update route (admin only)
router.put('/:vaId/:routeId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, routeId } = req.params;
    const { flight_number, route_type, departure_icao, departure_name, arrival_icao, arrival_name, aircraft_type } = req.body;

    // Check if flight number is being changed and if it already exists
    if (flight_number) {
      const [existing] = await db.query(
        'SELECT id FROM va_routes WHERE va_id = ? AND flight_number = ? AND id != ?',
        [vaId, flight_number, routeId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Flight number already exists' });
      }
    }

    await db.query(
      `UPDATE va_routes 
       SET flight_number = ?, route_type = ?, departure_icao = ?, departure_name = ?, 
           arrival_icao = ?, arrival_name = ?, aircraft_type = ?
       WHERE id = ? AND va_id = ?`,
      [flight_number, route_type, departure_icao, departure_name, arrival_icao, arrival_name, aircraft_type || null, routeId, vaId]
    );

    res.json({ message: 'Route updated successfully' });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// Delete route (admin only)
router.delete('/:vaId/:routeId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, routeId } = req.params;

    await db.query('DELETE FROM va_routes WHERE id = ? AND va_id = ?', [routeId, vaId]);

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

module.exports = router;
