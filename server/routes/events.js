const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const { uploadEventMiddleware } = require('../middleware/upload');

const router = express.Router();

// Get VA events
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [events] = await db.query(`
      SELECT e.*, a.icao_code as focus_airport_icao
      FROM events e
      LEFT JOIN airports a ON e.focus_airport_id = a.id
      WHERE va_id = ?
      ORDER BY start_date DESC
    `, [vaId]);

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get active VA events
router.get('/va/:vaId/active', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [events] = await db.query(`
      SELECT e.*, a.icao_code as focus_airport_icao
      FROM events e
      LEFT JOIN airports a ON e.focus_airport_id = a.id
      WHERE e.va_id = ? AND e.status = 'active'
      ORDER BY e.start_date ASC
    `, [vaId]);

    res.json({ events });
  } catch (error) {
    console.error('Get active events error:', error);
    res.status(500).json({ error: 'Failed to fetch active events' });
  }
});

// Create event (admin only)
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), uploadEventMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;
    const { name, description, event_type, start_date, end_date, bonus_points, status, cover_image_url } = req.body;

    // Determine cover image URL (Hostinger FTP URL or external URL)
    let finalCoverImage = cover_image_url || null;
    if (req.file) {
      finalCoverImage = req.file.path; // URL from Hostinger FTP
    }

    // Use provided status or default to 'upcoming'
    const eventStatus = status || 'upcoming';

    const [result] = await db.query(
      'INSERT INTO events (va_id, name, description, event_type, cover_image, start_date, end_date, bonus_points, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaId, name, description || null, event_type, finalCoverImage, start_date, end_date, bonus_points || 0, userId, eventStatus]
    );

    res.status(201).json({
      message: 'Event created successfully',
      eventId: result.insertId
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// Update event (admin only)
router.put('/:vaId/:eventId', authMiddleware, checkVARole(['Owner', 'Admin']), uploadEventMiddleware, async (req, res) => {
  try {
    const { vaId, eventId } = req.params;
    const { name, description, event_type, start_date, end_date, bonus_points, status, cover_image_url } = req.body;

    // Get current event data to preserve cover_image if not updating
    const [currentEvent] = await db.query(
      'SELECT cover_image FROM events WHERE id = ? AND va_id = ?',
      [eventId, vaId]
    );

    if (currentEvent.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Determine cover image URL (Hostinger FTP URL, external URL, or keep current)
    let finalCoverImage = currentEvent[0].cover_image;
    if (req.file) {
      finalCoverImage = req.file.path; // URL from Hostinger FTP
    } else if (cover_image_url) {
      finalCoverImage = cover_image_url;
    }

    await db.query(
      'UPDATE events SET name = ?, description = ?, event_type = ?, cover_image = ?, start_date = ?, end_date = ?, bonus_points = ?, status = ? WHERE id = ? AND va_id = ?',
      [name, description, event_type, finalCoverImage, start_date, end_date, bonus_points, status || 'active', eventId, vaId]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:vaId/:eventId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, eventId } = req.params;

    await db.query('DELETE FROM events WHERE id = ? AND va_id = ?', [eventId, vaId]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
