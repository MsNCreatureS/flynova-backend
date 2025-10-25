const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Search aircraft
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ aircraft: [] });
    }

    const searchTerm = `%${q}%`;
    
    const [aircraft] = await db.query(`
      SELECT 
        id,
        name,
        iata_code,
        icao_code
      FROM aircraft
      WHERE 
        (icao_code LIKE ? OR 
        iata_code LIKE ? OR 
        name LIKE ?)
      ORDER BY 
        CASE 
          WHEN icao_code LIKE ? THEN 1
          WHEN iata_code LIKE ? THEN 2
          WHEN name LIKE ? THEN 3
          ELSE 4
        END,
        name
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm, `${q}%`, `${q}%`, `${q}%`]);

    res.json({ aircraft });
  } catch (error) {
    console.error('Aircraft search error:', error);
    res.status(500).json({ error: 'Failed to search aircraft' });
  }
});

// Get all aircraft
router.get('/', async (req, res) => {
  try {
    const [aircraft] = await db.query(`
      SELECT 
        id,
        name,
        iata_code,
        icao_code
      FROM aircraft
      ORDER BY name
      LIMIT 100
    `);

    res.json({ aircraft });
  } catch (error) {
    console.error('Get aircraft error:', error);
    res.status(500).json({ error: 'Failed to fetch aircraft' });
  }
});

module.exports = router;
