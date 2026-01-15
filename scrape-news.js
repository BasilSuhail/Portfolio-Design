import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}
loadEnv();

// Free NewsAPI.org - 100 requests/day on free tier
// Sign up at: https://newsapi.org/register
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';

// Stock tickers for each category
const CATEGORIES = {
  ai_compute_infra: ['NVDA', 'AMD', 'GOOGL', 'MSFT', 'META'],
  fintech_regtech: ['SQ', 'PYPL', 'INTU', 'V', 'MA'],
  rpa_enterprise_ai: ['PATH', 'NOW', 'CRM'],
  semi_supply_chain: ['TSM', 'ASML', 'MU', 'AMAT'],
  cybersecurity: ['CRWD', 'PANW', 'ZS', 'FTNT']
};

const CATEGORY_NAMES = {
  ai_compute_infra: 'AI Compute & Infra',
  fintech_regtech: 'FinTech & RegTech',
  rpa_enterprise_ai: 'RPA & Enterprise AI',
  semi_supply_chain: 'Semiconductor Supply Chain',
  cybersecurity: 'Cybersecurity'
};

async function fetchNewsForTicker(ticker) {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set. Using placeholder data.');
    return [];
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${ticker}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      console.error(`Error fetching news for ${ticker}:`, data.message);
      return [];
    }

    return (data.articles || []).map(article => ({
      ticker,
      headline: article.title,
      url: article.url,
      source: article.source.name
    }));
  } catch (error) {
    console.error(`Failed to fetch news for ${ticker}:`, error.message);
    return [];
  }
}

async function generateDailyNews() {
  const today = new Date().toISOString().split('T')[0];
  const newsDay = {
    date: today,
    content: {
      briefing: '',
      ai_compute_infra: [],
      fintech_regtech: [],
      rpa_enterprise_ai: [],
      semi_supply_chain: [],
      cybersecurity: []
    }
  };

  console.log(`Fetching news for ${today}...`);

  // Fetch news for each category
  for (const [category, tickers] of Object.entries(CATEGORIES)) {
    console.log(`Fetching ${CATEGORY_NAMES[category]}...`);

    for (const ticker of tickers) {
      const articles = await fetchNewsForTicker(ticker);
      newsDay.content[category].push(...articles.slice(0, 2)); // Max 2 per ticker

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Limit to 5 articles per category
    newsDay.content[category] = newsDay.content[category].slice(0, 5);
  }

  // Generate AI briefing summary (you can enhance this with Gemini API)
  newsDay.content.briefing = generateBriefing(newsDay.content);

  return newsDay;
}

function generateBriefing(content) {
  const categories = [];

  if (content.ai_compute_infra?.length > 0) {
    categories.push('AI infrastructure and compute developments');
  }
  if (content.fintech_regtech?.length > 0) {
    categories.push('fintech innovations');
  }
  if (content.rpa_enterprise_ai?.length > 0) {
    categories.push('enterprise AI automation');
  }
  if (content.semi_supply_chain?.length > 0) {
    categories.push('semiconductor supply chain updates');
  }
  if (content.cybersecurity?.length > 0) {
    categories.push('cybersecurity advancements');
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Tech news briefing for ${date}. Today's highlights include ${categories.join(', ')}. Stay informed on the latest developments across AI, fintech, enterprise automation, semiconductors, and cybersecurity sectors.`;
}

async function updateNewsFeed() {
  const newsFeedPath = path.join(__dirname, 'news_feed.json');

  // Read existing news feed
  let newsFeed = [];
  if (fs.existsSync(newsFeedPath)) {
    const content = fs.readFileSync(newsFeedPath, 'utf-8');
    newsFeed = JSON.parse(content);
  }

  // Generate today's news
  const todayNews = await generateDailyNews();

  // Check if today's news already exists
  const today = todayNews.date;
  const existingIndex = newsFeed.findIndex(item => item.date === today);

  if (existingIndex >= 0) {
    newsFeed[existingIndex] = todayNews;
    console.log(`Updated news for ${today}`);
  } else {
    newsFeed.unshift(todayNews); // Add to beginning
    console.log(`Added news for ${today}`);
  }

  // Keep only last 7 days
  newsFeed = newsFeed.slice(0, 7);

  // Save to file
  fs.writeFileSync(newsFeedPath, JSON.stringify(newsFeed, null, 2));
  console.log(`News feed saved to ${newsFeedPath}`);
  console.log(`Total news days: ${newsFeed.length}`);
}

// Run the scraper
updateNewsFeed().catch(error => {
  console.error('Failed to update news feed:', error);
  process.exit(1);
});
