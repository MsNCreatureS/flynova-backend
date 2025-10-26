const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { uploadBugImageMiddleware } = require('../middleware/upload');

/**
 * POST /api/bug-reports
 * Submit a new bug report
 * Optional authentication (can be submitted by anonymous users)
 */
router.post('/', uploadBugImageMiddleware, async (req, res) => {
  try {
    const { username, title, description } = req.body;

    // Validation
    if (!username || !title || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'title', 'description']
      });
    }

    if (title.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less' });
    }

    // Extract user_id if authenticated
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Token invalid or expired, continue as anonymous
        console.log('Invalid token for bug report, continuing as anonymous');
      }
    }

    // Get image URL if uploaded
    const imageUrl = req.file ? req.file.publicUrl || req.file.path : null;

    // Insert bug report
    const query = `
      INSERT INTO bug_reports (user_id, username, title, description, image_url, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await db.execute(query, [
      userId,
      username,
      title,
      description,
      imageUrl
    ]);

    // Fetch the created bug report
    const [bugReports] = await db.execute(
      'SELECT * FROM bug_reports WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Bug report submitted successfully',
      bugReport: bugReports[0]
    });

  } catch (error) {
    console.error('Error submitting bug report:', error);
    res.status(500).json({ 
      error: 'Failed to submit bug report',
      details: error.message 
    });
  }
});

/**
 * GET /api/bug-reports
 * Get all bug reports (Super Admin only)
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT 
        br.*,
        u.username as user_username,
        u.email as user_email
      FROM bug_reports br
      LEFT JOIN users u ON br.user_id = u.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE br.status = ?';
      params.push(status);
    }

    query += ' ORDER BY br.created_at DESC';

    const [bugReports] = await db.execute(query, params);

    res.json({ bugReports });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bug reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/bug-reports/:id
 * Get a specific bug report (Super Admin only)
 */
router.get('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [bugReports] = await db.execute(`
      SELECT 
        br.*,
        u.username as user_username,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM bug_reports br
      LEFT JOIN users u ON br.user_id = u.id
      WHERE br.id = ?
    `, [id]);

    if (bugReports.length === 0) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json({ bugReport: bugReports[0] });

  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bug report',
      details: error.message 
    });
  }
});

/**
 * PATCH /api/bug-reports/:id
 * Update bug report status or add admin notes (Super Admin only)
 */
router.patch('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Validation
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await db.execute(
      `UPDATE bug_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated bug report
    const [bugReports] = await db.execute(
      'SELECT * FROM bug_reports WHERE id = ?',
      [id]
    );

    if (bugReports.length === 0) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json({
      message: 'Bug report updated successfully',
      bugReport: bugReports[0]
    });

  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({ 
      error: 'Failed to update bug report',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/bug-reports/:id
 * Delete a bug report (Super Admin only)
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM bug_reports WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bug report not found' });
    }

    res.json({ message: 'Bug report deleted successfully' });

  } catch (error) {
    console.error('Error deleting bug report:', error);
    res.status(500).json({ 
      error: 'Failed to delete bug report',
      details: error.message 
    });
  }
});

module.exports = router;
