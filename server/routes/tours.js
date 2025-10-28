const express = require('express');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');
const { uploadTour, uploadToHostinger } = require('../config/hostinger-upload');

const router = express.Router();

// ============================================
// TOUR MANAGEMENT ROUTES (Admin/Owner)
// ============================================

/**
 * GET /api/tours/va/:vaId
 * Get all tours for a VA
 */
router.get('/va/:vaId', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;

    const [tours] = await db.query(`
      SELECT 
        t.*,
        u.username as created_by_username,
        COUNT(DISTINCT tl.id) as total_legs,
        COUNT(DISTINCT tp.user_id) as participants_count,
        COUNT(DISTINCT CASE WHEN tp.status = 'completed' THEN tp.user_id END) as completions_count
      FROM va_tours t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN va_tour_legs tl ON t.id = tl.tour_id
      LEFT JOIN va_tour_progress tp ON t.id = tp.tour_id
      WHERE t.va_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [vaId]);

    res.json({ tours });
  } catch (error) {
    console.error('Get tours error:', error);
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

/**
 * GET /api/tours/va/:vaId/pilot/active
 * Get active tours for a pilot with their progress
 */
router.get('/va/:vaId/pilot/active', authMiddleware, async (req, res) => {
  try {
    const { vaId } = req.params;
    const userId = req.user.id;

    console.log('Fetching active tours for VA:', vaId, 'User:', userId);

    const [tours] = await db.query(`
      SELECT 
        t.*,
        COUNT(DISTINCT tl.id) as total_legs,
        tp.id as progress_id,
        tp.current_leg,
        tp.status as progress_status,
        tp.started_at,
        tp.completed_at,
        COALESCE(
          (SELECT COUNT(*) 
           FROM JSON_TABLE(
             COALESCE(tp.completed_legs, '[]'),
             '$[*]' COLUMNS(leg_id INT PATH '$')
           ) AS jt
          ), 0
        ) as completed_legs
      FROM va_tours t
      LEFT JOIN va_tour_legs tl ON t.id = tl.tour_id
      LEFT JOIN va_tour_progress tp ON t.id = tp.tour_id AND tp.user_id = ?
      WHERE t.va_id = ? 
      AND t.status = 'active'
      GROUP BY t.id, tp.id, tp.current_leg, tp.status, tp.started_at, tp.completed_at, tp.completed_legs
      ORDER BY tp.started_at DESC, t.created_at DESC
    `, [userId, vaId]);

    console.log('Tours found:', tours.length);
    console.log('Tours data:', JSON.stringify(tours, null, 2));

    res.json({ tours });
  } catch (error) {
    console.error('Get pilot active tours error:', error);
    res.status(500).json({ error: 'Failed to fetch active tours' });
  }
});

/**
 * GET /api/tours/:vaId/:tourId
 * Get specific tour details with legs
 */
router.get('/:vaId/:tourId', authMiddleware, async (req, res) => {
  try {
    const { vaId, tourId } = req.params;

    // Get tour info
    const [tours] = await db.query(`
      SELECT t.*, u.username as created_by_username
      FROM va_tours t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND t.va_id = ?
    `, [tourId, vaId]);

    if (tours.length === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    // Get legs
    const [legs] = await db.query(`
      SELECT * FROM va_tour_legs
      WHERE tour_id = ?
      ORDER BY leg_number ASC
    `, [tourId]);

    // Get user's progress if they're participating
    const [progress] = await db.query(`
      SELECT * FROM va_tour_progress
      WHERE tour_id = ? AND user_id = ?
    `, [tourId, req.user.id]);

    res.json({
      tour: tours[0],
      legs,
      userProgress: progress[0] || null
    });
  } catch (error) {
    console.error('Get tour details error:', error);
    res.status(500).json({ error: 'Failed to fetch tour details' });
  }
});

/**
 * POST /api/tours/:vaId
 * Create a new tour (Admin/Owner only)
 */
router.post('/:vaId', authMiddleware, checkVARole(['Owner', 'Admin']), uploadTour, async (req, res) => {
  try {
    const { vaId } = req.params;
    const {
      title,
      description,
      award_title,
      award_description,
      status,
      start_date,
      end_date,
      banner_image_url,
      award_image_url
    } = req.body;
    const userId = req.user.id;

    // Handle banner image (either uploaded file or URL)
    let bannerImage = banner_image_url || null;
    if (req.files && req.files.banner_image && req.files.banner_image[0]) {
      const file = req.files.banner_image[0];
      bannerImage = await uploadToHostinger(file.path, 'tours/banners');
    }

    // Handle award image (either uploaded file or URL)
    let awardImage = award_image_url || null;
    if (req.files && req.files.award_image && req.files.award_image[0]) {
      const file = req.files.award_image[0];
      awardImage = await uploadToHostinger(file.path, 'tours/awards');
    }

    const [result] = await db.query(`
      INSERT INTO va_tours 
      (va_id, title, description, banner_image, award_image, award_title, award_description, status, start_date, end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vaId,
      title,
      description,
      bannerImage,
      awardImage,
      award_title || null,
      award_description || null,
      status || 'draft',
      start_date || null,
      end_date || null,
      userId
    ]);

    res.status(201).json({
      message: 'Tour created successfully',
      tourId: result.insertId
    });
  } catch (error) {
    console.error('Create tour error:', error);
    res.status(500).json({ error: 'Failed to create tour' });
  }
});

/**
 * PUT /api/tours/:vaId/:tourId
 * Update a tour (Admin/Owner only)
 */
router.put('/:vaId/:tourId', authMiddleware, checkVARole(['Owner', 'Admin']), uploadTour, async (req, res) => {
  try {
    const { vaId, tourId } = req.params;
    const {
      title,
      description,
      award_title,
      award_description,
      status,
      start_date,
      end_date,
      banner_image_url,
      award_image_url
    } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (award_title !== undefined) {
      updateFields.push('award_title = ?');
      updateValues.push(award_title);
    }
    if (award_description !== undefined) {
      updateFields.push('award_description = ?');
      updateValues.push(award_description);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(end_date);
    }

    // Handle banner image update
    if (req.files && req.files.banner_image && req.files.banner_image[0]) {
      const file = req.files.banner_image[0];
      const bannerUrl = await uploadToHostinger(file.path, 'tours/banners');
      updateFields.push('banner_image = ?');
      updateValues.push(bannerUrl);
    } else if (banner_image_url !== undefined) {
      updateFields.push('banner_image = ?');
      updateValues.push(banner_image_url);
    }

    // Handle award image update
    if (req.files && req.files.award_image && req.files.award_image[0]) {
      const file = req.files.award_image[0];
      const awardUrl = await uploadToHostinger(file.path, 'tours/awards');
      updateFields.push('award_image = ?');
      updateValues.push(awardUrl);
    } else if (award_image_url !== undefined) {
      updateFields.push('award_image = ?');
      updateValues.push(award_image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(tourId, vaId);

    await db.query(
      `UPDATE va_tours SET ${updateFields.join(', ')} WHERE id = ? AND va_id = ?`,
      updateValues
    );

    res.json({ message: 'Tour updated successfully' });
  } catch (error) {
    console.error('Update tour error:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

/**
 * DELETE /api/tours/:vaId/:tourId
 * Delete a tour (Admin/Owner only)
 */
router.delete('/:vaId/:tourId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { vaId, tourId } = req.params;

    await db.query('DELETE FROM va_tours WHERE id = ? AND va_id = ?', [tourId, vaId]);

    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    console.error('Delete tour error:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

// ============================================
// TOUR LEGS MANAGEMENT
// ============================================

/**
 * GET /api/tours/:vaId/:tourId/legs
 * Get all legs for a tour
 */
router.get('/:vaId/:tourId/legs', authMiddleware, async (req, res) => {
  try {
    const { tourId } = req.params;

    const [legs] = await db.query(`
      SELECT * FROM va_tour_legs
      WHERE tour_id = ?
      ORDER BY leg_number ASC
    `, [tourId]);

    res.json({ legs });
  } catch (error) {
    console.error('Get tour legs error:', error);
    res.status(500).json({ error: 'Failed to fetch tour legs' });
  }
});

/**
 * POST /api/tours/:vaId/:tourId/legs
 * Add a new leg to a tour (Admin/Owner only)
 */
router.post('/:vaId/:tourId/legs', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { tourId } = req.params;
    const {
      leg_number,
      departure_icao,
      departure_name,
      arrival_icao,
      arrival_name,
      required_aircraft,
      min_flight_time,
      notes
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO va_tour_legs
      (tour_id, leg_number, departure_icao, departure_name, arrival_icao, arrival_name, required_aircraft, min_flight_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tourId,
      leg_number,
      departure_icao,
      departure_name || null,
      arrival_icao,
      arrival_name || null,
      required_aircraft || null,
      min_flight_time || null,
      notes || null
    ]);

    res.status(201).json({
      message: 'Tour leg added successfully',
      legId: result.insertId
    });
  } catch (error) {
    console.error('Add tour leg error:', error);
    res.status(500).json({ error: 'Failed to add tour leg' });
  }
});

/**
 * PUT /api/tours/:vaId/:tourId/legs/:legId
 * Update a tour leg (Admin/Owner only)
 */
router.put('/:vaId/:tourId/legs/:legId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { legId } = req.params;
    const {
      leg_number,
      departure_icao,
      departure_name,
      arrival_icao,
      arrival_name,
      required_aircraft,
      min_flight_time,
      notes
    } = req.body;

    await db.query(`
      UPDATE va_tour_legs
      SET leg_number = ?, departure_icao = ?, departure_name = ?, arrival_icao = ?, arrival_name = ?,
          required_aircraft = ?, min_flight_time = ?, notes = ?
      WHERE id = ?
    `, [
      leg_number,
      departure_icao,
      departure_name,
      arrival_icao,
      arrival_name,
      required_aircraft,
      min_flight_time,
      notes,
      legId
    ]);

    res.json({ message: 'Tour leg updated successfully' });
  } catch (error) {
    console.error('Update tour leg error:', error);
    res.status(500).json({ error: 'Failed to update tour leg' });
  }
});

/**
 * DELETE /api/tours/:vaId/:tourId/legs/:legId
 * Delete a tour leg (Admin/Owner only)
 */
router.delete('/:vaId/:tourId/legs/:legId', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { legId } = req.params;

    await db.query('DELETE FROM va_tour_legs WHERE id = ?', [legId]);

    res.json({ message: 'Tour leg deleted successfully' });
  } catch (error) {
    console.error('Delete tour leg error:', error);
    res.status(500).json({ error: 'Failed to delete tour leg' });
  }
});

// ============================================
// TOUR PROGRESS & PARTICIPATION
// ============================================

/**
 * GET /api/tours/:vaId/:tourId/progress
 * Get all participants' progress for a tour (Admin/Owner)
 */
router.get('/:vaId/:tourId/progress', authMiddleware, checkVARole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { tourId } = req.params;

    const [progress] = await db.query(`
      SELECT 
        tp.*,
        u.username,
        u.avatar_url,
        (SELECT COUNT(*) FROM va_tour_legs WHERE tour_id = ?) as total_legs
      FROM va_tour_progress tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.tour_id = ?
      ORDER BY tp.completed_at DESC, tp.current_leg DESC
    `, [tourId, tourId]);

    res.json({ progress });
  } catch (error) {
    console.error('Get tour progress error:', error);
    res.status(500).json({ error: 'Failed to fetch tour progress' });
  }
});

/**
 * POST /api/tours/:vaId/:tourId/join
 * Join a tour (start participating)
 */
router.post('/:vaId/:tourId/join', authMiddleware, async (req, res) => {
  try {
    const { vaId, tourId } = req.params;
    const userId = req.user.id;

    // Check if already participating
    const [existing] = await db.query(
      'SELECT id FROM va_tour_progress WHERE tour_id = ? AND user_id = ?',
      [tourId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already participating in this tour' });
    }

    // Create progress entry
    await db.query(`
      INSERT INTO va_tour_progress (tour_id, user_id, va_id, status, started_at)
      VALUES (?, ?, ?, 'in_progress', NOW())
    `, [tourId, userId, vaId]);

    res.status(201).json({ message: 'Successfully joined tour' });
  } catch (error) {
    console.error('Join tour error:', error);
    res.status(500).json({ error: 'Failed to join tour' });
  }
});

/**
 * GET /api/tours/:vaId/:tourId/my-progress
 * Get current user's progress in a tour
 */
router.get('/:vaId/:tourId/my-progress', authMiddleware, async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = req.user.id;

    const [progress] = await db.query(`
      SELECT * FROM va_tour_progress
      WHERE tour_id = ? AND user_id = ?
    `, [tourId, userId]);

    res.json({ progress: progress[0] || null });
  } catch (error) {
    console.error('Get my progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

module.exports = router;
