import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize gallery files if they don't exist
const galleryDataPath = path.join(__dirname, 'gallery.json');
const gallerySettingsPath = path.join(__dirname, 'gallery_settings.json');

// Create gallery.json if it doesn't exist
if (!fs.existsSync(galleryDataPath)) {
  const initialGallery = [];
  fs.writeFileSync(galleryDataPath, JSON.stringify(initialGallery, null, 2));
  console.log('Created gallery.json');
}

// Create gallery_settings.json if it doesn't exist
if (!fs.existsSync(gallerySettingsPath)) {
  const initialSettings = {
    visible: true
  };
  fs.writeFileSync(gallerySettingsPath, JSON.stringify(initialSettings, null, 2));
  console.log('Created gallery_settings.json');
}

console.log('Gallery initialization complete!');
