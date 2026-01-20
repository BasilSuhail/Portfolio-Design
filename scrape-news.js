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

// Google Gemini API for generating summaries
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Stock tickers and company names for each category
// Using company names for better search results
const CATEGORIES = {
  ai_compute_infra: [
    { ticker: 'NVDA', query: 'NVIDIA stock OR NVIDIA GPU' },
    { ticker: 'AMD', query: 'AMD stock OR AMD chips' },
    { ticker: 'GOOGL', query: 'Google AI OR Alphabet stock' },
    { ticker: 'MSFT', query: 'Microsoft AI OR Microsoft Azure' },
    { ticker: 'META', query: 'Meta AI OR Meta stock' }
  ],
  fintech_regtech: [
    { ticker: 'SQ', query: 'Block Inc stock OR Square payments' },
    { ticker: 'PYPL', query: 'PayPal stock OR PayPal payments' },
    { ticker: 'INTU', query: 'Intuit stock OR TurboTax' },
    { ticker: 'V', query: 'Visa stock OR Visa payments' },
    { ticker: 'MA', query: 'Mastercard stock OR Mastercard payments' }
  ],
  rpa_enterprise_ai: [
    { ticker: 'PATH', query: 'UiPath stock OR UiPath automation' },
    { ticker: 'NOW', query: 'ServiceNow stock OR ServiceNow platform' },
    { ticker: 'CRM', query: 'Salesforce stock OR Salesforce CRM' }
  ],
  semi_supply_chain: [
    { ticker: 'TSM', query: 'TSMC stock OR Taiwan Semiconductor' },
    { ticker: 'ASML', query: 'ASML stock OR ASML lithography' },
    { ticker: 'MU', query: 'Micron stock OR Micron memory' },
    { ticker: 'AMAT', query: 'Applied Materials stock' }
  ],
  cybersecurity: [
    { ticker: 'CRWD', query: 'CrowdStrike stock OR CrowdStrike security' },
    { ticker: 'PANW', query: 'Palo Alto Networks stock' },
    { ticker: 'ZS', query: 'Zscaler stock OR Zscaler security' },
    { ticker: 'FTNT', query: 'Fortinet stock OR Fortinet security' }
  ]
};

const CATEGORY_NAMES = {
  ai_compute_infra: 'AI Compute & Infra',
  fintech_regtech: 'FinTech & RegTech',
  rpa_enterprise_ai: 'RPA & Enterprise AI',
  semi_supply_chain: 'Semiconductor Supply Chain',
  cybersecurity: 'Cybersecurity'
};

// Get the last N days as date strings (YYYY-MM-DD)
function getLastNDays(n) {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

async function fetchNewsForStock(stock, fromDate, toDate) {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set. Using placeholder data.');
    return [];
  }

  const { ticker, query } = stock;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&from=${fromDate}&to=${toDate}&pageSize=5&apiKey=${NEWS_API_KEY}`;
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

async function generateNewsForDate(targetDate) {
  const newsDay = {
    date: targetDate,
    content: {
      briefing: '',
      ai_compute_infra: [],
      fintech_regtech: [],
      rpa_enterprise_ai: [],
      semi_supply_chain: [],
      cybersecurity: []
    }
  };

  console.log(`Fetching news for ${targetDate}...`);

  // For NewsAPI, we need to set the date range for that specific day
  const fromDate = targetDate;
  const toDate = targetDate;

  // Fetch news for each category
  for (const [category, stocks] of Object.entries(CATEGORIES)) {
    console.log(`  Fetching ${CATEGORY_NAMES[category]}...`);

    for (const stock of stocks) {
      const articles = await fetchNewsForStock(stock, fromDate, toDate);
      newsDay.content[category].push(...articles.slice(0, 2)); // Max 2 per ticker

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Limit to 5 articles per category
    newsDay.content[category] = newsDay.content[category].slice(0, 5);
  }

  // Generate AI briefing summary using Gemini
  console.log(`  Generating AI briefing with Gemini...`);
  newsDay.content.briefing = await generateBriefingWithGemini(newsDay.content, targetDate);

  return newsDay;
}

async function generateBriefingWithGemini(content, targetDate) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set. Using fallback briefing.');
    return generateFallbackBriefing(targetDate);
  }

  // Collect all headlines for the prompt
  const allHeadlines = [];

  if (content.ai_compute_infra?.length > 0) {
    allHeadlines.push('AI & Compute:', ...content.ai_compute_infra.map(a => `- ${a.ticker}: ${a.headline}`));
  }
  if (content.fintech_regtech?.length > 0) {
    allHeadlines.push('FinTech:', ...content.fintech_regtech.map(a => `- ${a.ticker}: ${a.headline}`));
  }
  if (content.rpa_enterprise_ai?.length > 0) {
    allHeadlines.push('Enterprise AI:', ...content.rpa_enterprise_ai.map(a => `- ${a.ticker}: ${a.headline}`));
  }
  if (content.semi_supply_chain?.length > 0) {
    allHeadlines.push('Semiconductors:', ...content.semi_supply_chain.map(a => `- ${a.ticker}: ${a.headline}`));
  }
  if (content.cybersecurity?.length > 0) {
    allHeadlines.push('Cybersecurity:', ...content.cybersecurity.map(a => `- ${a.ticker}: ${a.headline}`));
  }

  // If no headlines were found, return a fallback
  if (allHeadlines.length === 0) {
    return generateFallbackBriefing(targetDate);
  }

  const prompt = `You are a senior tech and finance analyst writing a daily briefing for investors tracking AI infrastructure, semiconductors, fintech, enterprise software, and cybersecurity stocks.

Based on the headlines from ${targetDate} below, write a 2-paragraph summary (around 150-200 words total) that:
1. Sounds like an experienced analyst, not generic AI text
2. Connects the dots between stories and explains what they mean for the sector
3. Highlights the most important developments and their implications
4. Uses specific details from the headlines (company names, numbers, products)
5. Avoids buzzwords and generic phrases like "exciting developments" or "stay tuned"

Headlines from ${targetDate}:
${allHeadlines.join('\n')}

Write two paragraphs of analysis. First paragraph should cover the biggest themes. Second paragraph should highlight secondary developments and what to watch. Do not use bullet points, markdown formatting, or headers. Just write natural flowing prose.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const briefing = data.candidates[0].content.parts[0].text.trim();
      console.log(`  Generated AI briefing successfully`);
      return briefing;
    } else {
      console.error('Unexpected Gemini response:', JSON.stringify(data, null, 2));
      return generateFallbackBriefing(targetDate);
    }
  } catch (error) {
    console.error('Failed to generate briefing with Gemini:', error.message);
    return generateFallbackBriefing(targetDate);
  }
}

function generateFallbackBriefing(targetDate) {
  const date = new Date(targetDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `Tech news briefing for ${date}. Check the articles below for today's key developments across AI infrastructure, fintech, enterprise automation, semiconductors, and cybersecurity.`;
}

async function updateNewsFeed() {
  const newsFeedPath = path.join(__dirname, 'news_feed.json');
  const DAYS_TO_KEEP = 8;

  // Read existing news feed
  let newsFeed = [];
  if (fs.existsSync(newsFeedPath)) {
    const content = fs.readFileSync(newsFeedPath, 'utf-8');
    newsFeed = JSON.parse(content);
  }

  // Get the last 8 days
  const last8Days = getLastNDays(DAYS_TO_KEEP);
  console.log(`Checking last ${DAYS_TO_KEEP} days: ${last8Days.join(', ')}`);

  // Find existing dates in the feed
  const existingDates = new Set(newsFeed.map(item => item.date));
  console.log(`Existing dates in feed: ${[...existingDates].join(', ') || 'none'}`);

  // Find missing dates (only within the last 8 days)
  const missingDates = last8Days.filter(date => !existingDates.has(date));

  if (missingDates.length === 0) {
    console.log('All dates are up to date. No missing days to fetch.');
    return;
  }

  console.log(`Missing dates to fetch: ${missingDates.join(', ')}`);

  // Fetch news for each missing date
  for (const date of missingDates) {
    console.log(`\n--- Fetching news for ${date} ---`);
    try {
      const newsForDate = await generateNewsForDate(date);

      // Check if we got any actual news content
      const hasContent = Object.keys(CATEGORIES).some(
        cat => newsForDate.content[cat]?.length > 0
      );

      if (hasContent) {
        newsFeed.push(newsForDate);
        console.log(`Added news for ${date}`);
      } else {
        console.log(`No news found for ${date}, skipping`);
      }

      // Rate limiting between days - wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to fetch news for ${date}:`, error.message);
    }
  }

  // Sort by date descending (newest first)
  newsFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Keep only the last 8 days worth of news (remove anything older)
  const cutoffDate = last8Days[last8Days.length - 1];
  newsFeed = newsFeed.filter(item => item.date >= cutoffDate);

  // Save to file
  fs.writeFileSync(newsFeedPath, JSON.stringify(newsFeed, null, 2));
  console.log(`\nNews feed saved to ${newsFeedPath}`);
  console.log(`Total news days: ${newsFeed.length}`);
}

// Run the scraper
updateNewsFeed().catch(error => {
  console.error('Failed to update news feed:', error);
  process.exit(1);
});
