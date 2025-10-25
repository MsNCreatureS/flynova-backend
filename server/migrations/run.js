const fs = require('fs');
const path = require('path');
const db = require('../config/database');
require('dotenv').config();

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    console.log('✅ Database migrations completed successfully');

    // Insert some default achievements
    await insertDefaultAchievements();

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function insertDefaultAchievements() {
  const achievements = [
    {
      name: 'First Flight',
      description: 'Complete your first flight',
      icon: '✈️',
      criteria: JSON.stringify({ flights: 1 }),
      points: 10,
      badge_color: 'blue'
    },
    {
      name: 'Century Club',
      description: 'Complete 100 flights',
      icon: '💯',
      criteria: JSON.stringify({ flights: 100 }),
      points: 100,
      badge_color: 'gold'
    },
    {
      name: 'Smooth Operator',
      description: 'Land with a rate better than -100 fpm',
      icon: '🎯',
      criteria: JSON.stringify({ landing_rate: -100 }),
      points: 25,
      badge_color: 'green'
    },
    {
      name: 'Globe Trotter',
      description: 'Fly to 50 different airports',
      icon: '🌍',
      criteria: JSON.stringify({ unique_airports: 50 }),
      points: 75,
      badge_color: 'purple'
    },
    {
      name: 'Night Owl',
      description: 'Complete 10 night flights',
      icon: '🌙',
      criteria: JSON.stringify({ night_flights: 10 }),
      points: 50,
      badge_color: 'indigo'
    }
  ];

  for (const achievement of achievements) {
    try {
      await db.query(
        'INSERT INTO achievements (name, description, icon, criteria, points, badge_color) VALUES (?, ?, ?, ?, ?, ?)',
        [achievement.name, achievement.description, achievement.icon, achievement.criteria, achievement.points, achievement.badge_color]
      );
    } catch (error) {
      // Ignore duplicate entries
    }
  }

  console.log('✅ Default achievements added');
}

runMigrations();
