// Initialize news files if they don't exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newsSettingsPath = path.join(__dirname, 'news_settings.json');
const newsFeedPath = path.join(__dirname, 'news_feed.json');

// Helper to check if path is a symlink
function isSymlink(filepath) {
  try {
    const stats = fs.lstatSync(filepath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

// Create news_settings.json if it doesn't exist
if (!fs.existsSync(newsSettingsPath)) {
  console.log('Creating news_settings.json...');
  fs.writeFileSync(newsSettingsPath, JSON.stringify({ visible: true }, null, 2));
}

// Create news_feed.json ONLY if it doesn't exist AND is not a symlink
// Symlinks point to persistent volume and should not be overwritten
if (!fs.existsSync(newsFeedPath) && !isSymlink(newsFeedPath)) {
  console.log('Creating news_feed.json...');
  fs.writeFileSync(newsFeedPath, JSON.stringify([], null, 2));
} else if (isSymlink(newsFeedPath)) {
  console.log('news_feed.json is a symlink to persistent volume - preserving');
}

console.log('News files initialized successfully');
