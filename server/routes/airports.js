const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Search airports
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ airports: [] });
    }

    const searchTerm = `%${q}%`;
    
    const [airports] = await db.query(`
      SELECT 
        id,
        name,
        city,
        country,
        iata_code,
        icao_code,
        latitude,
        longitude
      FROM airports
      WHERE 
        (icao_code LIKE ? OR 
        iata_code LIKE ? OR 
        name LIKE ? OR 
        city LIKE ?)
        AND icao_code IS NOT NULL
        AND icao_code != ''
      ORDER BY 
        CASE 
          WHEN icao_code LIKE ? THEN 1
          WHEN iata_code LIKE ? THEN 2
          WHEN name LIKE ? THEN 3
          ELSE 4
        END,
        name
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm, searchTerm, `${q}%`, `${q}%`, `${q}%`]);

    res.json({ airports });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({ error: 'Failed to search airports' });
  }
});

// Get airport by ICAO code
router.get('/icao/:icao', async (req, res) => {
  try {
    const { icao } = req.params;
    
    const [airports] = await db.query(`
      SELECT 
        id,
        name,
        city,
        country,
        iata_code,
        icao_code,
        latitude,
        longitude
      FROM airports
      WHERE icao_code = ?
    `, [icao]);

    if (airports.length === 0) {
      return res.status(404).json({ error: 'Airport not found' });
    }

    res.json({ airport: airports[0] });
  } catch (error) {
    console.error('Get airport error:', error);
    res.status(500).json({ error: 'Failed to fetch airport' });
  }
});

module.exports = router;
