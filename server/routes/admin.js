const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');

const router = express.Router();

// Get pending flight reports (admin only)
router.get('/:vaId/pending-reports', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId } = req.params;

    const [reports] = await db.query(`
      SELECT 
        fr.*,
        f.id as flight_id,
        f.flight_number,
        u.username,
        vr.flight_number as route_number,
        dep.icao_code as departure_icao,
        arr.icao_code as arrival_icao,
        a.name as aircraft_name
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      JOIN users u ON f.user_id = u.id
      JOIN va_routes vr ON f.route_id = vr.id
      JOIN airports dep ON vr.departure_airport_id = dep.id
      JOIN airports arr ON vr.arrival_airport_id = arr.id
      LEFT JOIN va_fleet vf ON f.fleet_id = vf.id
      LEFT JOIN aircraft a ON vf.aircraft_id = a.id
      WHERE f.va_id = ? AND fr.validation_status = 'pending'
      ORDER BY fr.created_at ASC
    `, [vaId]);

    res.json({ reports });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reports' });
  }
});

// Validate/Reject flight report (admin only)
router.post('/:vaId/validate-report/:reportId', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId, reportId } = req.params;
    const { status, adminNotes, pointsAwarded } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get flight info
    const [reports] = await db.query(`
      SELECT fr.*, f.user_id, f.va_id, fr.flight_duration
      FROM flight_reports fr
      JOIN flights f ON fr.flight_id = f.id
      WHERE fr.id = ? AND f.va_id = ?
    `, [reportId, vaId]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Flight report not found' });
    }

    const report = reports[0];

    // Update report
    await db.query(
      'UPDATE flight_reports SET validation_status = ?, admin_id = ?, admin_notes = ?, points_awarded = ?, validated_at = NOW() WHERE id = ?',
      [status, adminId, adminNotes || null, pointsAwarded || 0, reportId]
    );

    // If approved, update user stats
    if (status === 'approved') {
      const hours = report.flight_duration ? report.flight_duration / 60 : 0;
      await db.query(
        `UPDATE va_members 
         SET points = points + ?, total_flights = total_flights + 1, total_hours = total_hours + ?
         WHERE user_id = ? AND va_id = ?`,
        [pointsAwarded || 0, hours, report.user_id, vaId]
      );
    }

    res.json({ message: `Flight report ${status}` });
  } catch (error) {
    console.error('Validate report error:', error);
    res.status(500).json({ error: 'Failed to validate report' });
  }
});

// Get VA members (admin only)
router.get('/:vaId/members', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId } = req.params;

    const [members] = await db.query(`
      SELECT 
        vm.*,
        u.username,
        u.email,
        u.avatar_url
      FROM va_members vm
      JOIN users u ON vm.user_id = u.id
      WHERE vm.va_id = ?
      ORDER BY vm.join_date DESC
    `, [vaId]);

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update member role (owner only)
router.put('/:vaId/members/:memberId', authMiddleware, checkVARole(['owner']), async (req, res) => {
  try {
    const { vaId, memberId } = req.params;
    const { role, status } = req.body;

    await db.query(
      'UPDATE va_members SET role = ?, status = ? WHERE id = ? AND va_id = ?',
      [role, status, memberId, vaId]
    );

    res.json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Get VA events
router.get('/:vaId/events', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [events] = await db.query(`
      SELECT 
        e.*,
        ap.name as focus_airport_name,
        ap.icao_code as focus_airport_icao,
        u.username as created_by_username
      FROM events e
      LEFT JOIN airports ap ON e.focus_airport_id = ap.id
      JOIN users u ON e.created_by = u.id
      WHERE e.va_id = ?
      ORDER BY e.start_date DESC
    `, [vaId]);

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create event (admin only)
router.post('/:vaId/events', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { name, description, eventType, focusAirportId, startDate, endDate, bonusPoints } = req.body;
    const userId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO events (va_id, name, description, event_type, focus_airport_id, start_date, end_date, bonus_points, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vaId, name, description, eventType, focusAirportId || null, startDate, endDate, bonusPoints || 0, userId]
    );

    res.status(201).json({
      message: 'Event created successfully',
      eventId: result.insertId
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (admin only)
router.put('/:vaId/events/:eventId', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId, eventId } = req.params;
    const { name, description, status, bonusPoints } = req.body;

    await db.query(
      'UPDATE events SET name = ?, description = ?, status = ?, bonus_points = ? WHERE id = ? AND va_id = ?',
      [name, description, status, bonusPoints, eventId, vaId]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:vaId/events/:eventId', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId, eventId } = req.params;

    await db.query('DELETE FROM events WHERE id = ? AND va_id = ?', [eventId, vaId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get VA statistics (admin only)
router.get('/:vaId/statistics', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId } = req.params;

    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT vm.user_id) as total_members,
        COUNT(DISTINCT vf.id) as total_aircraft,
        COUNT(DISTINCT vr.id) as total_routes,
        COUNT(DISTINCT f.id) as total_flights,
        COUNT(DISTINCT CASE WHEN f.status = 'in_progress' THEN f.id END) as active_flights,
        COUNT(DISTINCT CASE WHEN fr.validation_status = 'pending' THEN fr.id END) as pending_reports,
        SUM(CASE WHEN vm.status = 'active' THEN vm.total_hours ELSE 0 END) as total_hours
      FROM virtual_airlines va
      LEFT JOIN va_members vm ON va.id = vm.va_id
      LEFT JOIN va_fleet vf ON va.id = vf.va_id
      LEFT JOIN va_routes vr ON va.id = vr.va_id
      LEFT JOIN flights f ON va.id = f.va_id
      LEFT JOIN flight_reports fr ON f.id = fr.flight_id
      WHERE va.id = ?
    `, [vaId]);

    res.json({ statistics: stats[0] });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
