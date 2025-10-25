const axios = require('axios');
const db = require('../server/config/database');

const AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';
const AIRCRAFT_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat';

/**
 * Parse CSV line (OpenFlights uses commas, handles quoted fields)
 */
function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field.trim());
  
  return fields.map(f => f === '\\N' || f === '' ? null : f.replace(/^"|"$/g, ''));
}

/**
 * Import airports from OpenFlights
 */
async function importAirports() {
  try {
    console.log('📥 Downloading airports data from OpenFlights...');
    const response = await axios.get(AIRPORTS_URL);
    const lines = response.data.split('\n').filter(line => line.trim());

    console.log(`✅ Downloaded ${lines.length} airports`);
    console.log('💾 Importing into database...');

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      try {
        const fields = parseCSVLine(line);
        
        // OpenFlights airports.dat format:
        // 0: Airport ID, 1: Name, 2: City, 3: Country, 4: IATA, 5: ICAO, 
        // 6: Latitude, 7: Longitude, 8: Altitude, 9: Timezone, 10: DST, 11: Tz database
        
        const [
          id, name, city, country, iata, icao, 
          latitude, longitude, altitude, timezone_offset, dst, timezone
        ] = fields;

        // Skip if missing critical data
        if (!name || (!iata && !icao)) {
          skipped++;
          continue;
        }

        await db.query(
          `INSERT INTO airports 
          (name, city, country, iata_code, icao_code, latitude, longitude, altitude, timezone_offset, dst, timezone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            city = VALUES(city),
            country = VALUES(country),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            altitude = VALUES(altitude),
            timezone_offset = VALUES(timezone_offset),
            dst = VALUES(dst),
            timezone = VALUES(timezone)`,
          [
            name,
            city,
            country,
            iata || null,
            icao || null,
            parseFloat(latitude) || null,
            parseFloat(longitude) || null,
            parseInt(altitude) || null,
            parseFloat(timezone_offset) || null,
            dst,
            timezone
          ]
        );

        imported++;
        
        if (imported % 1000 === 0) {
          console.log(`  ✈️  Imported ${imported} airports...`);
        }
      } catch (error) {
        console.error(`⚠️  Error importing airport: ${error.message}`);
        skipped++;
      }
    }

    console.log(`\n✅ Airports import completed!`);
    console.log(`   - Imported: ${imported}`);
    console.log(`   - Skipped: ${skipped}`);
    
    return { imported, skipped };
  } catch (error) {
    console.error('❌ Error importing airports:', error);
    throw error;
  }
}

/**
 * Import aircraft from OpenFlights
 */
async function importAircraft() {
  try {
    console.log('\n📥 Downloading aircraft data from OpenFlights...');
    const response = await axios.get(AIRCRAFT_URL);
    const lines = response.data.split('\n').filter(line => line.trim());

    console.log(`✅ Downloaded ${lines.length} aircraft`);
    console.log('💾 Importing into database...');

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      try {
        const fields = parseCSVLine(line);
        
        // OpenFlights planes.dat format:
        // 0: Name, 1: IATA code, 2: ICAO code
        
        const [name, iata, icao] = fields;

        // Skip if missing critical data
        if (!name || (!iata && !icao)) {
          skipped++;
          continue;
        }

        await db.query(
          `INSERT INTO aircraft (name, iata_code, icao_code)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name)`,
          [
            name,
            iata || null,
            icao || null
          ]
        );

        imported++;
        
        if (imported % 100 === 0) {
          console.log(`  ✈️  Imported ${imported} aircraft...`);
        }
      } catch (error) {
        console.error(`⚠️  Error importing aircraft: ${error.message}`);
        skipped++;
      }
    }

    console.log(`\n✅ Aircraft import completed!`);
    console.log(`   - Imported: ${imported}`);
    console.log(`   - Skipped: ${skipped}`);
    
    return { imported, skipped };
  } catch (error) {
    console.error('❌ Error importing aircraft:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 FlyNova - OpenFlights Data Import');
    console.log('=====================================\n');

    const startTime = Date.now();

    // Import airports
    const airportsResult = await importAirports();

    // Import aircraft
    const aircraftResult = await importAircraft();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Import completed successfully!');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('\n📊 Summary:');
    console.log(`   Airports: ${airportsResult.imported} imported, ${airportsResult.skipped} skipped`);
    console.log(`   Aircraft: ${aircraftResult.imported} imported, ${aircraftResult.skipped} skipped`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
