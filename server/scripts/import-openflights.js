const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
require('dotenv').config();

async function importOpenFlightsData() {
  try {
    console.log('🚀 Starting OpenFlights data import...');

    // Import Aircraft
    await importAircraft();

    // Import Airports
    await importAirports();

    console.log('✅ OpenFlights data import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

async function importAircraft() {
  console.log('📦 Importing aircraft data...');

  try {
    const response = await axios.get(process.env.AIRCRAFT_DATA_URL || 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat');
    const lines = response.data.split('\n').filter(line => line.trim());

    let imported = 0;

    for (const line of lines) {
      const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
      
      if (parts.length >= 2) {
        const [name, iataCode, icaoCode] = parts;

        try {
          await db.query(
            'INSERT INTO aircraft (name, iata_code, icao_code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
            [name, iataCode || null, icaoCode || null]
          );
          imported++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ Imported ${imported} aircraft`);
  } catch (error) {
    console.error('❌ Failed to import aircraft:', error.message);
  }
}

async function importAirports() {
  console.log('📦 Importing airports data...');

  try {
    const response = await axios.get(process.env.AIRPORTS_DATA_URL || 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat');
    const lines = response.data.split('\n').filter(line => line.trim());

    let imported = 0;

    for (const line of lines) {
      const parts = line.split(',').map(p => p.replace(/"/g, '').trim());

      if (parts.length >= 11) {
        const [
          id, name, city, country, iataCode, icaoCode, 
          latitude, longitude, altitude, timezoneOffset, dst, timezone
        ] = parts;

        // Skip airports without ICAO or IATA codes
        if (!iataCode && !icaoCode) continue;

        try {
          await db.query(
            `INSERT INTO airports (name, city, country, iata_code, icao_code, latitude, longitude, altitude, timezone_offset, dst, timezone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city), country = VALUES(country)`,
            [
              name,
              city,
              country,
              iataCode || null,
              icaoCode || null,
              parseFloat(latitude) || null,
              parseFloat(longitude) || null,
              parseInt(altitude) || null,
              parseFloat(timezoneOffset) || null,
              dst || null,
              timezone || null
            ]
          );
          imported++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    console.log(`✅ Imported ${imported} airports`);
  } catch (error) {
    console.error('❌ Failed to import airports:', error.message);
  }
}

importOpenFlightsData();
