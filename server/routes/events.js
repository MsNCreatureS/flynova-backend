const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for event cover images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/events/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
    const now = new Date().toISOString();

    console.log('Fetching active events for VA:', vaId, 'at time:', now); // Debug

    // Auto-update event statuses based on dates
    const [updateResult] = await db.query(`
      UPDATE events 
      SET status = CASE
        WHEN start_date <= ? AND end_date >= ? AND status != 'cancelled' THEN 'active'
        WHEN start_date > ? AND status != 'cancelled' THEN 'upcoming'
        WHEN end_date < ? AND status != 'cancelled' THEN 'completed'
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
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), upload.single('cover_image'), async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;
    const { name, description, event_type, start_date, end_date, bonus_points, cover_image_url } = req.body;

    // Determine cover image URL (uploaded file or external URL)
    let finalCoverImage = cover_image_url || null;
    if (req.file) {
      finalCoverImage = '/uploads/events/' + req.file.filename;
    }

    const [result] = await db.query(
      'INSERT INTO events (va_id, name, description, event_type, cover_image, start_date, end_date, bonus_points, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [vaId, name, description || null, event_type, finalCoverImage, start_date, end_date, bonus_points || 0, userId]
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
router.put('/:vaId/:eventId', authMiddleware, checkVARole(['Owner', 'Admin']), upload.single('cover_image'), async (req, res) => {
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

    // Determine cover image URL (uploaded file, external URL, or keep current)
    let finalCoverImage = currentEvent[0].cover_image;
    if (req.file) {
      finalCoverImage = '/uploads/events/' + req.file.filename;
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
