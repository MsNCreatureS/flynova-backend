const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authMiddleware, checkVARole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }, // 10MB default
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get downloads for a VA
router.get('/:vaId', async (req, res) => {
  try {
    const { vaId } = req.params;

    const [downloads] = await db.query(`
      SELECT 
        d.*,
        u.username as uploaded_by_username,
        a.name as aircraft_name,
        a.icao_code as aircraft_icao
      FROM downloads d
      JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN aircraft a ON d.aircraft_id = a.id
      WHERE d.va_id = ? AND d.status = 'active'
      ORDER BY d.created_at DESC
    `, [vaId]);

    res.json({ downloads });
  } catch (error) {
    console.error('Get downloads error:', error);
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// Add download (file upload OR external URL) (admin only)
router.post('/:vaId/add', authMiddleware, checkVARole(['owner', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { title, description, fileType, aircraftId, externalUrl, isExternalUrl } = req.body;
    const userId = req.user.id;

    let fileUrl, fileName, fileSize, isExternal;

    // Check if it's an external URL or file upload
    if (isExternalUrl === 'true' || isExternalUrl === true) {
      // External URL (for liveries, etc.)
      if (!externalUrl) {
        return res.status(400).json({ error: 'External URL is required' });
      }
      fileUrl = externalUrl;
      fileName = null;
      fileSize = null;
      isExternal = true;
    } else {
      // File upload
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      isExternal = false;
    }

    const [result] = await db.query(
      `INSERT INTO downloads (va_id, title, description, file_type, file_name, file_url, file_size, is_external_url, aircraft_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vaId, title, description, fileType, fileName, fileUrl, fileSize, isExternal, aircraftId || null, userId]
    );

    res.status(201).json({
      message: isExternal ? 'Download link added successfully' : 'File uploaded successfully',
      downloadId: result.insertId,
      fileUrl,
      isExternal
    });
  } catch (error) {
    console.error('Add download error:', error);
    res.status(500).json({ error: 'Failed to add download' });
  }
});

// Legacy endpoint for backward compatibility
router.post('/:vaId/upload', authMiddleware, checkVARole(['owner', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { vaId } = req.params;
    const { title, description, fileType, aircraftId } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const [result] = await db.query(
      `INSERT INTO downloads (va_id, title, description, file_type, file_name, file_url, file_size, is_external_url, aircraft_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vaId, title, description, fileType, req.file.originalname, fileUrl, req.file.size, false, aircraftId || null, userId]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      downloadId: result.insertId,
      fileUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete download (admin only)
router.delete('/:vaId/:downloadId', authMiddleware, checkVARole(['owner', 'admin']), async (req, res) => {
  try {
    const { vaId, downloadId } = req.params;

    // Get file info
    const [downloads] = await db.query(
      'SELECT file_url, is_external_url FROM downloads WHERE id = ? AND va_id = ?',
      [downloadId, vaId]
    );

    if (downloads.length === 0) {
      return res.status(404).json({ error: 'Download not found' });
    }

    // Only delete file from filesystem if it's a local file (not external URL)
    if (!downloads[0].is_external_url) {
      const filePath = path.join(__dirname, '../../public', downloads[0].file_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await db.query('DELETE FROM downloads WHERE id = ? AND va_id = ?', [downloadId, vaId]);

    res.json({ message: 'Download deleted successfully' });
  } catch (error) {
    console.error('Delete download error:', error);
    res.status(500).json({ error: 'Failed to delete download' });
  }
});

// Increment download count
router.post('/:vaId/:downloadId/track', async (req, res) => {
  try {
    const { downloadId } = req.params;

    await db.query(
      'UPDATE downloads SET download_count = download_count + 1 WHERE id = ?',
      [downloadId]
    );

    res.json({ message: 'Download tracked' });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ error: 'Failed to track download' });
  }
});

module.exports = router;
