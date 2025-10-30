const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all active flights on the map
router.get('/active-flights', async (req, res) => {
  try {
    const [flights] = await db.query(`
      SELECT 
        flt.*,
        f.status as flight_status,
        f.departure_time,
        f.arrival_time
      FROM flight_live_tracking flt
      INNER JOIN flights f ON flt.flight_id = f.id
      WHERE f.status = 'in_progress'
        AND flt.last_update > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      ORDER BY flt.last_update DESC
    `);

    res.json({ 
      success: true, 
      flights,
      count: flights.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching active flights:', error);
    res.status(500).json({ error: 'Failed to fetch active flights' });
  }
});

// Update flight position (called by tracker)
router.post('/update-position', authMiddleware, async (req, res) => {
  try {
    const {
      flight_id,
      latitude,
      longitude,
      altitude,
      heading,
      ground_speed,
      vertical_speed
    } = req.body;

    // Validate required fields
    if (!flight_id || !latitude || !longitude || !altitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get flight details
    const [flights] = await db.query(`
      SELECT 
        f.*,
        r.flight_number,
        r.departure_icao,
        r.arrival_icao,
        fleet.registration as aircraft_registration,
        fleet.aircraft_type,
        u.username as pilot_username,
        u.avatar_url as pilot_avatar_url,
        va.name as va_name,
        va.callsign as va_callsign,
        va.logo_url as va_logo_url
      FROM flights f
      INNER JOIN va_routes r ON f.route_id = r.id
      INNER JOIN users u ON f.user_id = u.id
      INNER JOIN virtual_airlines va ON f.va_id = va.id
      LEFT JOIN va_fleet fleet ON f.fleet_id = fleet.id
      WHERE f.id = ? AND f.user_id = ? AND f.status = 'in_progress'
    `, [flight_id, req.user.id]);

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found or not in progress' });
    }

    const flight = flights[0];

    // Insert or update tracking data
    await db.query(`
      INSERT INTO flight_live_tracking (
        flight_id, user_id, va_id,
        latitude, longitude, altitude, heading, ground_speed, vertical_speed,
        flight_number, departure_icao, arrival_icao,
        aircraft_registration, aircraft_type,
        pilot_username, pilot_avatar_url,
        va_name, va_callsign, va_logo_url,
        flight_started_at, last_update
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        altitude = VALUES(altitude),
        heading = VALUES(heading),
        ground_speed = VALUES(ground_speed),
        vertical_speed = VALUES(vertical_speed),
        last_update = NOW()
    `, [
      flight_id, req.user.id, flight.va_id,
      latitude, longitude, altitude, heading, ground_speed, vertical_speed,
      flight.flight_number, flight.departure_icao, flight.arrival_icao,
      flight.aircraft_registration, flight.aircraft_type,
      flight.pilot_username, flight.pilot_avatar_url,
      flight.va_name, flight.va_callsign, flight.va_logo_url,
      flight.departure_time
    ]);

    res.json({ 
      success: true, 
      message: 'Position updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

// Get specific flight tracking details
router.get('/flight/:flightId', async (req, res) => {
  try {
    const [flights] = await db.query(`
      SELECT flt.*, f.status
      FROM flight_live_tracking flt
      INNER JOIN flights f ON flt.flight_id = f.id
      WHERE flt.flight_id = ?
    `, [req.params.flightId]);

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight tracking data not found' });
    }

    res.json({ success: true, flight: flights[0] });
  } catch (error) {
    console.error('Error fetching flight details:', error);
    res.status(500).json({ error: 'Failed to fetch flight details' });
  }
});

// Manual cleanup endpoint (for admin/maintenance)
router.delete('/cleanup', authMiddleware, async (req, res) => {
  try {
    // Delete stale tracking data
    const [result1] = await db.query(`
      DELETE FROM flight_live_tracking
      WHERE last_update < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `);

    // Delete tracking data for completed/cancelled flights
    const [result2] = await db.query(`
      DELETE flt FROM flight_live_tracking flt
      INNER JOIN flights f ON flt.flight_id = f.id
      WHERE f.status IN ('completed', 'cancelled')
    `);

    res.json({ 
      success: true, 
      deleted_stale: result1.affectedRows,
      deleted_completed: result2.affectedRows,
      total_deleted: result1.affectedRows + result2.affectedRows
    });
  } catch (error) {
    console.error('Error cleaning up tracking data:', error);
    res.status(500).json({ error: 'Failed to cleanup tracking data' });
  }
});

module.exports = router;
