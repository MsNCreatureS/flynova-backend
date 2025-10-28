const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const { uploadEventMiddleware } = require('../middleware/upload');

const router = express.Router();

// Update all event statuses (can be called via cron or manually)
router.post('/update-statuses', authMiddleware, async (req, res) => {
  try {
    // Call the stored procedure
    await db.query('CALL update_all_event_statuses()');
    
    res.json({ 
      message: 'Event statuses updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update event statuses error:', error);
    res.status(500).json({ error: 'Failed to update event statuses' });
  }
});

// Get VA events
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;
    const now = new Date().toISOString();

    // Fix any truncated statuses first
    await db.query(`
      UPDATE events 
      SET status = 'upcoming' 
      WHERE status = 'upcomin' AND va_id = ?
    `, [vaId]);

    // Auto-update event statuses based on dates
    await db.query(`
      UPDATE events 
      SET status = CASE
        WHEN end_date < ? AND status != 'cancelled' THEN 'completed'
        WHEN start_date <= ? AND end_date >= ? AND status != 'cancelled' THEN 'active'
        WHEN start_date > ? AND status != 'cancelled' THEN 'upcoming'
        ELSE status
      END
      WHERE va_id = ?
    `, [now, now, now, now, vaId]);

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
    const now = new Date().toISOString();

    console.log('Fetching active events for VA:', vaId, 'at time:', now); // Debug

    // Fix any truncated statuses first
    await db.query(`
      UPDATE events 
      SET status = 'upcoming' 
      WHERE status = 'upcomin' AND va_id = ?
    `, [vaId]);

    // Auto-update event statuses based on dates
    const [updateResult] = await db.query(`
      UPDATE events 
      SET status = CASE
        WHEN end_date < ? AND status != 'cancelled' THEN 'completed'
        WHEN start_date <= ? AND end_date >= ? AND status != 'cancelled' THEN 'active'
        WHEN start_date > ? AND status != 'cancelled' THEN 'upcoming'
        ELSE status
      END
      WHERE va_id = ?
    `, [now, now, now, now, vaId]);

    console.log('Updated event statuses, affected rows:', updateResult.affectedRows); // Debug

    // Check all events for this VA (debug)
    const [allEvents] = await db.query(`
      SELECT id, name, status, start_date, end_date
      FROM events
      WHERE va_id = ?
      ORDER BY start_date DESC
    `, [vaId]);
    
    console.log('All events for VA', vaId, ':', allEvents); // Debug

    // Fetch active events
    const [events] = await db.query(`
      SELECT e.*, a.icao_code as focus_airport_icao
      FROM events e
      LEFT JOIN airports a ON e.focus_airport_id = a.id
      WHERE e.va_id = ? 
        AND e.status = 'active'
        AND e.start_date <= ?
        AND e.end_date >= ?
      ORDER BY e.start_date ASC
    `, [vaId, now, now]);

    console.log('Active events found:', events.length); // Debug

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
    const { name, description, event_type, start_date, end_date, bonus_points, cover_image_url } = req.body;

    console.log('Creating event for VA:', vaId);
    console.log('Event data:', { name, event_type, start_date, end_date });
    console.log('File uploaded:', req.file ? 'Yes' : 'No');
    console.log('File details:', req.file);
    console.log('External URL:', cover_image_url);

    // Determine cover image URL (Hostinger FTP URL or external URL)
    let finalCoverImage = cover_image_url || null;
    if (req.file) {
      finalCoverImage = req.file.path; // URL from Hostinger FTP
      console.log('Using uploaded file URL:', finalCoverImage);
    } else if (cover_image_url) {
      console.log('Using external URL:', cover_image_url);
    }

    // Determine initial status based on dates
    const now = new Date();
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    let initialStatus = 'upcoming';
    if (now >= startDate && now <= endDate) {
      initialStatus = 'active';
    } else if (now > endDate) {
      initialStatus = 'completed';
    }

    console.log('Determined initial status:', initialStatus, 'based on dates:', {
      now: now.toISOString(),
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    const [result] = await db.query(
      'INSERT INTO events (va_id, name, description, event_type, cover_image, start_date, end_date, bonus_points, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaId, name, description || null, event_type, finalCoverImage, start_date, end_date, bonus_points || 0, userId, initialStatus]
    );

    console.log('Event created successfully with ID:', result.insertId, 'and status:', initialStatus);

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
