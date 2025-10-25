const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's flights (MUST BE BEFORE /:flightId to avoid route conflict)
router.get('/my-flights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [flights] = await db.query(`
      SELECT 
        f.*,
        va.name as va_name,
        va.callsign as va_callsign,
        vr.flight_number,
        vr.departure_name,
        vr.departure_icao,
        vr.arrival_name,
        vr.arrival_icao,
        vf.aircraft_name,
        vf.registration as aircraft_registration,
        fr.validation_status,
        fr.points_awarded
      FROM flights f
      JOIN virtual_airlines va ON f.va_id = va.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vf ON f.fleet_id = vf.id
      LEFT JOIN flight_reports fr ON f.id = fr.flight_id
      WHERE f.user_id = ?
      ORDER BY f.reserved_at DESC
    `, [userId]);

    res.json({ flights });
  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

// Get flight details by ID
router.get('/:flightId', authMiddleware, async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;

    const [flights] = await db.query(`
      SELECT 
        f.*,
        vr.flight_number,
        vr.departure_icao,
        vr.departure_name,
        vr.arrival_icao,
        vr.arrival_name,
        vfl.registration as aircraft_registration,
        vfl.aircraft_name,
        vfl.aircraft_type as aircraft_icao
      FROM flights f
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vfl ON f.fleet_id = vfl.id
      WHERE f.id = ? AND f.user_id = ?
    `, [flightId, userId]);

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json({ flight: flights[0] });
  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({ error: 'Failed to fetch flight' });
  }
});

// Book a flight
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { va_id, route_id, fleet_id } = req.body;
    const userId = req.user.id;

    // Verify user is member of VA
    const [membership] = await db.query(
      'SELECT id FROM va_members WHERE user_id = ? AND va_id = ? AND status = "active"',
      [userId, va_id]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'Not a member of this Virtual Airline' });
    }

    // Get route info
    const [routes] = await db.query(
      'SELECT flight_number FROM va_routes WHERE id = ? AND va_id = ?',
      [route_id, va_id]
    );

    if (routes.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const [result] = await db.query(
      'INSERT INTO flights (user_id, va_id, route_id, fleet_id, flight_number, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, va_id, route_id, fleet_id || null, routes[0].flight_number, 'reserved']
    );

    res.status(201).json({
      message: 'Flight booked successfully',
      flight: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Book flight error:', error);
    res.status(500).json({ error: 'Failed to book flight' });
  }
});

// Update SimBrief OFP ID
router.put('/:flightId/simbrief', authMiddleware, async (req, res) => {
  try {
    const { flightId } = req.params;
    const { simbrief_ofp_id } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const [flights] = await db.query(
      'SELECT id FROM flights WHERE id = ? AND user_id = ?',
      [flightId, userId]
    );

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    await db.query(
      'UPDATE flights SET simbrief_ofp_id = ? WHERE id = ?',
      [simbrief_ofp_id, flightId]
    );

    res.json({ message: 'SimBrief OFP ID saved successfully' });
  } catch (error) {
    console.error('Update SimBrief OFP error:', error);
    res.status(500).json({ error: 'Failed to update SimBrief OFP ID' });
  }
});

// Start flight (tracker integration)
router.put('/:flightId/start', authMiddleware, async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [flights] = await db.query(
      'SELECT id FROM flights WHERE id = ? AND user_id = ? AND status = "reserved"',
      [flightId, userId]
    );

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found or already started' });
    }

    await db.query(
      'UPDATE flights SET status = ?, departure_time = NOW() WHERE id = ?',
      ['in_progress', flightId]
    );

    res.json({ message: 'Flight started successfully' });
  } catch (error) {
    console.error('Start flight error:', error);
    res.status(500).json({ error: 'Failed to start flight' });
  }
});

// Submit flight report (tracker integration)
router.post('/:flightId/report', authMiddleware, async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;
    const {
      actualDepartureTime,
      actualArrivalTime,
      flightDuration,
      distanceFlown,
      fuelUsed,
      landingRate,
      telemetryData
    } = req.body;

    // Verify ownership
    const [flights] = await db.query(
      'SELECT id, va_id FROM flights WHERE id = ? AND user_id = ? AND status = "in_progress"',
      [flightId, userId]
    );

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found or not in progress' });
    }

    // Update flight status
    await db.query(
      'UPDATE flights SET status = ?, arrival_time = NOW() WHERE id = ?',
      ['completed', flightId]
    );

    // Create flight report
    await db.query(
      `INSERT INTO flight_reports 
       (flight_id, actual_departure_time, actual_arrival_time, flight_duration, distance_flown, fuel_used, landing_rate, telemetry_data) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [flightId, actualDepartureTime, actualArrivalTime, flightDuration, distanceFlown, fuelUsed, landingRate, JSON.stringify(telemetryData)]
    );

    res.json({ message: 'Flight report submitted successfully' });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Failed to submit flight report' });
  }
});

// Get active flights for a VA
router.get('/va/:vaId/active', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [flights] = await db.query(`
      SELECT 
        f.id,
        f.flight_number,
        f.status,
        f.departure_time,
        u.username as pilot_username,
        vr.departure_icao,
        vr.departure_name,
        vr.arrival_icao,
        vr.arrival_name,
        vfl.registration as aircraft_registration
      FROM flights f
      JOIN users u ON f.user_id = u.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vfl ON f.fleet_id = vfl.id
      WHERE f.va_id = ? AND f.status IN ('in_progress', 'reserved')
      ORDER BY f.departure_time DESC
    `, [vaId]);

    res.json({ flights });
  } catch (error) {
    console.error('Get active flights error:', error);
    res.status(500).json({ error: 'Failed to fetch active flights' });
  }
});

// Delete/Cancel a flight reservation
router.delete('/:flightId', authMiddleware, async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;

    // Check if flight exists and belongs to user
    const [flights] = await db.query(
      'SELECT * FROM flights WHERE id = ? AND user_id = ?',
      [flightId, userId]
    );

    if (flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found or unauthorized' });
    }

    // Only allow deletion of reserved flights (not in progress or completed)
    if (flights[0].status !== 'reserved') {
      return res.status(400).json({ error: 'Can only cancel reserved flights' });
    }

    // Delete the flight
    await db.query('DELETE FROM flights WHERE id = ?', [flightId]);

    res.json({ message: 'Flight reservation cancelled successfully' });
  } catch (error) {
    console.error('Delete flight error:', error);
    res.status(500).json({ error: 'Failed to cancel flight reservation' });
  }
});

// Get pilot's own flight reports for a VA
router.get('/my-reports/:vaId', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    const [reports] = await db.query(`
      SELECT 
        fr.*,
        f.id as flight_id,
        vr.flight_number,
        f.status as flight_status,
        vr.departure_icao,
        vr.departure_name,
        vr.arrival_icao,
        vr.arrival_name,
        vfl.registration as aircraft_registration,
        vfl.aircraft_name,
        vfl.aircraft_type
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vfl ON f.fleet_id = vfl.id
      WHERE f.user_id = ? AND f.va_id = ?
      ORDER BY fr.created_at DESC
    `, [userId, vaId]);

    res.json(reports);
  } catch (error) {
    console.error('Get pilot reports error:', error);
    res.status(500).json({ error: 'Failed to fetch flight reports' });
  }
});

// Get pending flight reports for a VA (Admin/Owner only)
router.get('/va/:vaId/reports', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const { status } = req.query; // pending, approved, rejected, or all

    // Check if user is admin or owner
    const [membership] = await db.query(
      'SELECT role FROM va_members WHERE user_id = ? AND va_id = ? AND status = "active"',
      [req.user.id, vaId]
    );

    // Also check if user is the VA owner
    const [va] = await db.query('SELECT owner_id FROM virtual_airlines WHERE id = ?', [vaId]);

    if (membership.length === 0 && (va.length === 0 || va[0].owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (membership.length > 0 && !['Owner', 'Admin'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let statusFilter = 'WHERE f.va_id = ?';
    const params = [vaId];

    if (status && status !== 'all') {
      statusFilter += ' AND fr.validation_status = ?';
      params.push(status);
    }

    const [reports] = await db.query(`
      SELECT 
        fr.*,
        f.id as flight_id,
        f.flight_number,
        f.status as flight_status,
        u.username as pilot_username,
        u.id as pilot_id,
        vr.departure_icao,
        vr.departure_name,
        vr.arrival_icao,
        vr.arrival_name,
        vfl.registration as aircraft_registration,
        vfl.aircraft_name,
        vfl.aircraft_type,
        dep_airport.latitude as dep_lat,
        dep_airport.longitude as dep_lon,
        arr_airport.latitude as arr_lat,
        arr_airport.longitude as arr_lon
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      JOIN users u ON f.user_id = u.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vfl ON f.fleet_id = vfl.id
      LEFT JOIN airports dep_airport ON vr.departure_icao = dep_airport.icao_code
      LEFT JOIN airports arr_airport ON vr.arrival_icao = arr_airport.icao_code
      ${statusFilter}
      ORDER BY fr.created_at DESC
    `, params);

    res.json({ reports });
  } catch (error) {
    console.error('Get flight reports error:', error);
    res.status(500).json({ error: 'Failed to fetch flight reports' });
  }
});

// Get single flight report details (Admin/Owner only)
router.get('/reports/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;

    const [reports] = await db.query(`
      SELECT 
        fr.*,
        f.id as flight_id,
        f.va_id,
        f.flight_number,
        f.status as flight_status,
        u.username as pilot_username,
        u.id as pilot_id,
        vr.departure_icao,
        vr.departure_name,
        vr.arrival_icao,
        vr.arrival_name,
        vfl.registration as aircraft_registration,
        vfl.aircraft_name,
        vfl.aircraft_type,
        dep_airport.latitude as dep_lat,
        dep_airport.longitude as dep_lon,
        arr_airport.latitude as arr_lat,
        arr_airport.longitude as arr_lon
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      JOIN users u ON f.user_id = u.id
      JOIN va_routes vr ON f.route_id = vr.id
      LEFT JOIN va_fleet vfl ON f.fleet_id = vfl.id
      LEFT JOIN airports dep_airport ON vr.departure_icao = dep_airport.icao_code
      LEFT JOIN airports arr_airport ON vr.arrival_icao = arr_airport.icao_code
      WHERE fr.id = ?
    `, [reportId]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Flight report not found' });
    }

    const report = reports[0];

    // Check if user is admin or owner
    const [membership] = await db.query(
      'SELECT role FROM va_members WHERE user_id = ? AND va_id = ? AND status = "active"',
      [req.user.id, report.va_id]
    );

    const [va] = await db.query('SELECT owner_id FROM virtual_airlines WHERE id = ?', [report.va_id]);

    if (membership.length === 0 && (va.length === 0 || va[0].owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (membership.length > 0 && !['Owner', 'Admin'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get flight report error:', error);
    res.status(500).json({ error: 'Failed to fetch flight report' });
  }
});

// Validate flight report (Admin/Owner only)
router.put('/reports/:reportId/validate', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { validation_status, admin_notes, points_awarded } = req.body;

    // Get report and check permissions
    const [reports] = await db.query(`
      SELECT fr.*, f.va_id, f.user_id
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      WHERE fr.id = ?
    `, [reportId]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Flight report not found' });
    }

    const report = reports[0];

    // Check if user is admin or owner
    const [membership] = await db.query(
      'SELECT role FROM va_members WHERE user_id = ? AND va_id = ? AND status = "active"',
      [req.user.id, report.va_id]
    );

    const [va] = await db.query('SELECT owner_id FROM virtual_airlines WHERE id = ?', [report.va_id]);

    if (membership.length === 0 && (va.length === 0 || va[0].owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (membership.length > 0 && !['Owner', 'Admin'].includes(membership[0].role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update flight report
    await db.query(
      `UPDATE flight_reports 
       SET validation_status = ?, admin_id = ?, admin_notes = ?, points_awarded = ?, validated_at = NOW()
       WHERE id = ?`,
      [validation_status, req.user.id, admin_notes || null, points_awarded || 0, reportId]
    );

    // If approved, update member stats
    if (validation_status === 'approved') {
      const flightDuration = report.flight_duration || 0;
      const hours = flightDuration / 60;

      await db.query(
        `UPDATE va_members 
         SET points = points + ?, total_flights = total_flights + 1, total_hours = total_hours + ?
         WHERE user_id = ? AND va_id = ?`,
        [points_awarded || 0, hours, report.user_id, report.va_id]
      );
    }

    res.json({ message: 'Flight report validated successfully' });
  } catch (error) {
    console.error('Validate flight report error:', error);
    res.status(500).json({ error: 'Failed to validate flight report' });
  }
});

module.exports = router;
