// Initialize news files if they don't exist
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newsSettingsPath = path.join(__dirname, 'news_settings.json');
const newsFeedPath = path.join(__dirname, 'news_feed.json');

// Create news_settings.json if it doesn't exist
if (!fs.existsSync(newsSettingsPath)) {
  console.log('Creating news_settings.json...');
  fs.writeFileSync(newsSettingsPath, JSON.stringify({ visible: true }, null, 2));
}

// Create news_feed.json if it doesn't exist
if (!fs.existsSync(newsFeedPath)) {
  console.log('Creating news_feed.json...');
  fs.writeFileSync(newsFeedPath, JSON.stringify([], null, 2));
}

console.log('News files initialized successfully');
