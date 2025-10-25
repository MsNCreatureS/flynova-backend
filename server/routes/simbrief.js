const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// SimBrief API Key - MUST be kept secret on server side
const SIMBRIEF_API_KEY = '7visKd8EEiXJGFc0Jsp8LSu2Ck5L7WQw';

/**
 * Generate API code for SimBrief authentication
 * This matches the logic from simbrief.apiv1.php
 * IMPORTANT: The api_req parameter should be: orig+dest+type+timestamp+outputpage (concatenated)
 * Then we hash: MD5(API_KEY + api_req)
 */
router.post('/generate-apicode', (req, res) => {
  try {
    const { orig, dest, type, timestamp, outputpage } = req.body;

    // Validate required parameters
    if (!orig || !dest || !type) {
      return res.status(400).json({ 
        error: 'Missing required parameters: orig, dest, type' 
      });
    }

    // Build api_req string exactly like the JavaScript does
    // api_req = orig + dest + type + timestamp + outputpage
    const api_req = orig + dest + type + timestamp + outputpage;
    
    // Generate API code using MD5 hash
    // Format: MD5(API_KEY + api_req)
    const apiString = SIMBRIEF_API_KEY + api_req;
    const apicode = crypto
      .createHash('md5')
      .update(apiString)
      .digest('hex');
    // Note: SimBrief uses the FULL hash, not substring(0,10)

    res.json({ apicode });
  } catch (error) {
    console.error('Error generating API code:', error);
    res.status(500).json({ error: 'Failed to generate API code' });
  }
});

/**
 * Check if OFP file exists on SimBrief servers
 */
router.get('/check-ofp/:ofpId', async (req, res) => {
  try {
    const { ofpId } = req.params;
    
    // Validate OFP ID format
    if (!/^\d{10}_[A-Za-z0-9]{10}$/.test(ofpId)) {
      return res.status(400).json({ 
        exists: false, 
        error: 'Invalid OFP ID format' 
      });
    }

    // Check if XML file exists using native fetch (Node.js 18+)
    const response = await fetch(
      `https://www.simbrief.com/ofp/flightplans/xml/${ofpId}.xml`,
      { method: 'HEAD' }
    );

    res.json({ exists: response.ok });
  } catch (error) {
    console.error('Error checking OFP:', error);
    res.json({ exists: false });
  }
});

/**
 * Proxy endpoint to fetch SimBrief data (to avoid CORS issues)
 */
router.get('/fetch-ofp/:ofpId', async (req, res) => {
  try {
    const { ofpId } = req.params;
    
    // Validate OFP ID format
    if (!/^\d{10}_[A-Za-z0-9]{10}$/.test(ofpId)) {
      return res.status(400).json({ 
        error: 'Invalid OFP ID format' 
      });
    }

    // Fetch from SimBrief using native fetch (Node.js 18+)
    const response = await fetch(
      `https://www.simbrief.com/api/xml.fetcher.php?ofp_id=${ofpId}&json=1`
    );

    if (!response.ok) {
      return res.status(404).json({ 
        error: 'OFP not found' 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching OFP:', error);
    res.status(500).json({ error: 'Failed to fetch OFP data' });
  }
});

module.exports = router;
