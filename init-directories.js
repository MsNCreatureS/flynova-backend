#!/usr/bin/env node
/**
 * Script d'initialisation - Crée les dossiers nécessaires
 * Exécuté automatiquement avant le démarrage sur Railway
 */

const fs = require('fs');
const path = require('path');

const directories = [
  'public/uploads',
  'public/uploads/events',
  'public/uploads/logos',
  'logs'
];

console.log('📁 Création des dossiers nécessaires...\n');

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Créé: ${dir}`);
  } else {
    console.log(`○ Existe déjà: ${dir}`);
  }
});

console.log('\n✅ Initialisation terminée!');
