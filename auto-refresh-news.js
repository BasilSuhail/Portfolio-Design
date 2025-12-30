import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Auto-refresh news at noon (12:00 PM) daily
async function autoRefreshNews() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if it's noon (12:00 PM)
  if (currentHour === 12 && currentMinute === 0) {
    console.log('Auto-refreshing news at noon...');
    try {
      await execPromise('node scrape-news.js');
      console.log('News auto-refresh completed successfully');
    } catch (error) {
      console.error('Failed to auto-refresh news:', error);
    }
  }
}

// Check every minute if it's time to refresh
setInterval(autoRefreshNews, 60000); // 60000ms = 1 minute

console.log('Auto-refresh service started. Will refresh news daily at 12:00 PM');
