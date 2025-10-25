#!/usr/bin/env node

/**
 * FlyNova Setup Script
 * Automated setup for development environment
 */

const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n✈️  Welcome to FlyNova Setup!\n');
  console.log('This wizard will help you set up your development environment.\n');

  try {
    // Check if .env exists
    if (fs.existsSync('.env')) {
      const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Keeping existing .env file.');
        rl.close();
        return;
      }
    }

    console.log('\n📝 Please provide the following information:\n');

    // Database Configuration
    const dbHost = await question('Database Host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database Port (default: 3306): ') || '3306';
    const dbUser = await question('Database User (default: root): ') || 'root';
    const dbPassword = await question('Database Password: ');
    const dbName = await question('Database Name (default: flynova): ') || 'flynova';

    // Application Configuration
    const port = await question('API Port (default: 3001): ') || '3001';
    const jwtSecret = generateSecret();

    // Create .env file
    const envContent = `# Application
NODE_ENV=development
PORT=${port}
NEXT_PUBLIC_API_URL=http://localhost:${port}/api

# Database
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# JWT
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760

# OpenFlights Data URLs
AIRPORTS_DATA_URL=https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
AIRCRAFT_DATA_URL=https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!\n');

    // Ask if they want to create database
    const createDb = await question('Create database now? (Y/n): ');
    if (createDb.toLowerCase() !== 'n') {
      console.log('\n📦 Creating database...');
      try {
        await execPromise(`mysql -u ${dbUser} -p${dbPassword} -e "CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);
        console.log('✅ Database created successfully!');
      } catch (error) {
        console.log('⚠️  Could not create database automatically. Please create it manually.');
      }
    }

    // Ask if they want to run migrations
    const runMigrations = await question('Run database migrations now? (Y/n): ');
    if (runMigrations.toLowerCase() !== 'n') {
      console.log('\n📦 Running migrations...');
      try {
        await execPromise('node server/migrations/run.js');
        console.log('✅ Migrations completed successfully!');
      } catch (error) {
        console.log('⚠️  Migration error:', error.message);
      }
    }

    // Ask if they want to import OpenFlights data
    const importData = await question('Import OpenFlights data (aircraft & airports)? (Y/n): ');
    if (importData.toLowerCase() !== 'n') {
      console.log('\n📦 Importing data (this may take a few minutes)...');
      try {
        await execPromise('node server/scripts/import-openflights.js');
        console.log('✅ Data imported successfully!');
      } catch (error) {
        console.log('⚠️  Import error:', error.message);
      }
    }

    console.log('\n🎉 Setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Install dependencies: npm install');
    console.log('  2. Start API server: npm run server:dev');
    console.log('  3. Start frontend: npm run dev');
    console.log('  4. Open http://localhost:3000\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let secret = '';
  for (let i = 0; i < 64; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

setup();
