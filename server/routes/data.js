const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all aircraft
router.get('/aircraft', async (req, res) => {
  try {
    const [aircraft] = await db.query('SELECT * FROM aircraft ORDER BY name');
    res.json({ aircraft });
  } catch (error) {
    console.error('Get aircraft error:', error);
    res.status(500).json({ error: 'Failed to fetch aircraft' });
  }
});

// Search aircraft
router.get('/aircraft/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    const [aircraft] = await db.query(
      'SELECT * FROM aircraft WHERE name LIKE ? OR icao_code LIKE ? OR iata_code LIKE ? LIMIT 50',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    
    res.json({ aircraft });
  } catch (error) {
    console.error('Search aircraft error:', error);
    res.status(500).json({ error: 'Failed to search aircraft' });
  }
});

// Get all airports
router.get('/airports', async (req, res) => {
  try {
    const [airports] = await db.query('SELECT * FROM airports ORDER BY name LIMIT 1000');
    res.json({ airports });
  } catch (error) {
    console.error('Get airports error:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

// Search airports
router.get('/airports/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    const [airports] = await db.query(
      'SELECT * FROM airports WHERE name LIKE ? OR icao_code LIKE ? OR iata_code LIKE ? OR city LIKE ? LIMIT 50',
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );
    
    res.json({ airports });
  } catch (error) {
    console.error('Search airports error:', error);
    res.status(500).json({ error: 'Failed to search airports' });
  }
});

module.exports = router;
