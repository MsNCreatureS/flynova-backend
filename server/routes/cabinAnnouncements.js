const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const { uploadCabinAnnouncementMiddleware } = require('../middleware/upload');

const router = express.Router();

// Get all cabin announcements for a VA
router.get('/:vaId', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;

    const [announcements] = await db.query(`
      SELECT 
        ca.*,
        u.username as uploaded_by_username
      FROM va_cabin_announcements ca
      LEFT JOIN users u ON ca.uploaded_by = u.id
      WHERE ca.va_id = ?
      ORDER BY ca.announcement_type, ca.created_at DESC
    `, [vaId]);

    res.json({ announcements });
  } catch (error) {
    console.error('Get cabin announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch cabin announcements' });
  }
});

// Upload a new cabin announcement (Admin/Owner only)
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), uploadCabinAnnouncementMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const { title, description, announcement_type, duration } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioUrl = req.file.path; // URL from Hostinger FTP
    const fileSize = req.file.size || 0;

    const [result] = await db.query(`
      INSERT INTO va_cabin_announcements 
      (va_id, title, description, audio_url, announcement_type, duration, file_size, uploaded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [vaId, title, description || null, audioUrl, announcement_type || 'custom', duration || 0, fileSize, userId]);

    const [announcement] = await db.query(`
      SELECT 
        ca.*,
        u.username as uploaded_by_username
      FROM va_cabin_announcements ca
      LEFT JOIN users u ON ca.uploaded_by = u.id
      WHERE ca.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      message: 'Cabin announcement uploaded successfully',
      announcement: announcement[0]
    });
  } catch (error) {
    console.error('Upload cabin announcement error:', error);
    res.status(500).json({ error: 'Failed to upload cabin announcement' });
  }
});

// Delete a cabin announcement (Admin/Owner only)
router.delete('/:vaId/:announcementId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, announcementId } = req.params;

    // Verify the announcement belongs to this VA
    const [announcement] = await db.query(
      'SELECT id FROM va_cabin_announcements WHERE id = ? AND va_id = ?',
      [announcementId, vaId]
    );

    if (announcement.length === 0) {
      return res.status(404).json({ error: 'Cabin announcement not found' });
    }

    await db.query('DELETE FROM va_cabin_announcements WHERE id = ?', [announcementId]);

    res.json({ message: 'Cabin announcement deleted successfully' });
  } catch (error) {
    console.error('Delete cabin announcement error:', error);
    res.status(500).json({ error: 'Failed to delete cabin announcement' });
  }
});

module.exports = router;
