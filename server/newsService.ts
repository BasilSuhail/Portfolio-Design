import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { runMarketIntelligence, getHistoricalAnalysis, getSentimentHistory, type DailyAnalysis } from "./marketIntelligence";
import { callGemini } from "./geminiPool";
import { fetchRSSForCategory, type RSSNewsArticle } from "./rssService";

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fsSync.existsSync(envPath)) {
    const envContent = fsSync.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          let value = trimmed.substring(eqIndex + 1).trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log("Loaded environment variables from .env");
  }
}
loadEnv();

// ============================================
// NewsAPI Key Pool - Multiple keys for higher limits
// ============================================
function loadNewsApiKeys(): string[] {
  const keys: string[] = [];

  // Check for NEWS_API_KEY, NEWS_API_KEY_2, NEWS_API_KEY_3, etc.
  if (process.env.NEWS_API_KEY) keys.push(process.env.NEWS_API_KEY);
  if (process.env.NEWS_API_KEY_2) keys.push(process.env.NEWS_API_KEY_2);
  if (process.env.NEWS_API_KEY_3) keys.push(process.env.NEWS_API_KEY_3);

  return keys.filter(k => k && !k.includes("YOUR_"));
}

const NEWS_API_KEYS = loadNewsApiKeys();
let currentNewsKeyIndex = 0;

// Track which keys have hit rate limits
const rateLimitedKeys = new Set<string>();

function getNextNewsApiKey(): string | null {
  if (NEWS_API_KEYS.length === 0) return null;

  // Find a key that isn't rate limited
  for (let i = 0; i < NEWS_API_KEYS.length; i++) {
    const keyIndex = (currentNewsKeyIndex + i) % NEWS_API_KEYS.length;
    const key = NEWS_API_KEYS[keyIndex];

    if (!rateLimitedKeys.has(key)) {
      currentNewsKeyIndex = (keyIndex + 1) % NEWS_API_KEYS.length;
      return key;
    }
  }

  // All keys are rate limited
  console.warn("[NewsAPI] All API keys are rate limited");
  return null;
}

function markKeyAsRateLimited(key: string): void {
  rateLimitedKeys.add(key);
  console.warn(`[NewsAPI] Key ${NEWS_API_KEYS.indexOf(key) + 1}/${NEWS_API_KEYS.length} hit rate limit`);
}

// Reset rate limits periodically (every 12 hours they partially reset)
function resetRateLimits(): void {
  rateLimitedKeys.clear();
  console.log("[NewsAPI] Rate limit tracking reset");
}

// Reset rate limits every 12 hours
setInterval(resetRateLimits, 12 * 60 * 60 * 1000);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DAYS_TO_KEEP = 365; // 1 year of news for comprehensive trend analysis

// Flag to enable/disable full market intelligence analysis
const ENABLE_MARKET_INTELLIGENCE = true;

// Log API key status (not the actual keys for security)
console.log(`[NewsAPI] Initialized with ${NEWS_API_KEYS.length} API key(s)`);
console.log(`GEMINI_API_KEY configured: ${GEMINI_API_KEY ? "Yes" : "No"}`);
console.log(`[NewsAPI] Keeping ${DAYS_TO_KEEP} days of news history`);

// Use NEWS_FEED_DIR env var if set (for Docker volume mounts), otherwise use current directory
const newsFeedDir = process.env.NEWS_FEED_DIR || process.cwd();
const newsFeedPath = path.join(newsFeedDir, "news_feed.json");
console.log(`[NewsAPI] Using news feed path: ${newsFeedPath}`);

// Consolidated queries - ONE API call per category to stay within rate limits
// NewsAPI free tier: 100 requests/day (50 every 12 hours)
// With 7 categories = 7 requests per day, we can sync ~7 days of news within limits
const CATEGORIES: Record<string, Array<{ ticker: string; query: string }>> = {
  ai_compute_infra: [
    { ticker: "AI", query: "NVIDIA OR AMD OR Google AI OR Microsoft AI OR Meta AI" },
  ],
  fintech_regtech: [
    { ticker: "FIN", query: "PayPal OR Visa payments OR Mastercard OR fintech" },
  ],
  rpa_enterprise_ai: [
    { ticker: "ENT", query: "ServiceNow OR Salesforce OR UiPath OR enterprise AI" },
  ],
  semi_supply_chain: [
    { ticker: "SEMI", query: "TSMC OR ASML OR semiconductor shortage OR chip manufacturing" },
  ],
  cybersecurity: [
    { ticker: "SEC", query: "CrowdStrike OR Palo Alto Networks OR cybersecurity breach" },
  ],
  geopolitics: [
    { ticker: "GEO", query: "US China tech OR Taiwan semiconductor OR tech sanctions" },
  ],
};

const CATEGORY_NAMES: Record<string, string> = {
  ai_compute_infra: "AI Compute & Infra",
  fintech_regtech: "FinTech & RegTech",
  rpa_enterprise_ai: "RPA & Enterprise AI",
  semi_supply_chain: "Semiconductor Supply Chain",
  cybersecurity: "Cybersecurity",
  geopolitics: "Geopolitics",
};

interface NewsArticle {
  ticker: string;
  headline: string;
  url: string;
  source: string;
}

interface NewsDay {
  date: string;
  content: {
    briefing: string;
    ai_compute_infra: NewsArticle[];
    fintech_regtech: NewsArticle[];
    rpa_enterprise_ai: NewsArticle[];
    semi_supply_chain: NewsArticle[];
    cybersecurity: NewsArticle[];
    geopolitics: NewsArticle[];
  };
}

// Get the last N days as date strings (YYYY-MM-DD)
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNewsForCategory(
  stock: { ticker: string; query: string },
  fromDate: string,
  toDate: string,
  category?: string
): Promise<NewsArticle[]> {
  const apiKey = getNextNewsApiKey();

  // If no API key available, try RSS feeds directly
  if (!apiKey) {
    console.warn("[NewsAPI] No available API keys. Falling back to RSS feeds.");
    if (category) {
      const rssArticles = await fetchRSSForCategory(category);
      return rssArticles.map(a => ({
        ticker: a.ticker,
        headline: a.headline,
        url: a.url,
        source: a.source,
      }));
    }
    return [];
  }

  const { ticker, query } = stock;

  try {
    const encodedQuery = encodeURIComponent(query);
    // Fetch more articles per category (10 instead of 5) since we're making fewer API calls
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&from=${fromDate}&to=${toDate}&pageSize=10&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") {
      // Check if it's a rate limit error
      if (data.message?.includes("rate limit") || data.message?.includes("too many requests")) {
        markKeyAsRateLimited(apiKey);
        // Try again with a different key
        const nextKey = getNextNewsApiKey();
        if (nextKey) {
          console.log(`[NewsAPI] Retrying with different key...`);
          const retryUrl = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&from=${fromDate}&to=${toDate}&pageSize=10&apiKey=${nextKey}`;
          const retryResponse = await fetch(retryUrl);
          const retryData = await retryResponse.json();

          if (retryData.status === "ok") {
            return (retryData.articles || []).map((article: any) => ({
              ticker,
              headline: article.title,
              url: article.url,
              source: article.source.name,
            }));
          }

          if (retryData.message?.includes("rate limit") || retryData.message?.includes("too many requests")) {
            markKeyAsRateLimited(nextKey);
          }
        }

        // All API keys exhausted, fall back to RSS
        console.log(`[NewsAPI] All keys exhausted. Falling back to RSS for ${category || 'unknown'}...`);
        if (category) {
          const rssArticles = await fetchRSSForCategory(category);
          return rssArticles.map(a => ({
            ticker: a.ticker,
            headline: a.headline,
            url: a.url,
            source: a.source,
          }));
        }
      }
      console.error(`[NewsAPI] Error fetching news for ${ticker}:`, data.message);

      // Fall back to RSS on any API error
      if (category) {
        console.log(`[NewsAPI] Falling back to RSS for ${category}...`);
        const rssArticles = await fetchRSSForCategory(category);
        return rssArticles.map(a => ({
          ticker: a.ticker,
          headline: a.headline,
          url: a.url,
          source: a.source,
        }));
      }
      return [];
    }

    const apiArticles = (data.articles || []).map((article: any) => ({
      ticker,
      headline: article.title,
      url: article.url,
      source: article.source.name,
    }));

    // If API returned few results, supplement with RSS
    if (apiArticles.length < 5 && category) {
      console.log(`[NewsAPI] Only ${apiArticles.length} articles. Supplementing with RSS...`);
      const rssArticles = await fetchRSSForCategory(category);
      const rssFormatted = rssArticles.map(a => ({
        ticker: a.ticker,
        headline: a.headline,
        url: a.url,
        source: a.source,
      }));
      // Merge and dedupe by URL
      const allUrls = new Set(apiArticles.map((a: NewsArticle) => a.url));
      for (const rss of rssFormatted) {
        if (!allUrls.has(rss.url)) {
          apiArticles.push(rss);
          allUrls.add(rss.url);
        }
      }
    }

    return apiArticles;
  } catch (error: any) {
    console.error(`[NewsAPI] Failed to fetch news for ${ticker}:`, error.message);

    // Fall back to RSS on fetch error
    if (category) {
      console.log(`[NewsAPI] Network error. Falling back to RSS for ${category}...`);
      const rssArticles = await fetchRSSForCategory(category);
      return rssArticles.map(a => ({
        ticker: a.ticker,
        headline: a.headline,
        url: a.url,
        source: a.source,
      }));
    }
    return [];
  }
}

async function generateBriefingWithGemini(
  content: NewsDay["content"],
  targetDate: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set. Using fallback briefing.");
    return generateFallbackBriefing(targetDate);
  }

  // Collect all headlines for the prompt
  const allHeadlines: string[] = [];
  let totalArticles = 0;

  if (content.ai_compute_infra && content.ai_compute_infra.length > 0) {
    allHeadlines.push(
      "\nAI & Compute Infrastructure:",
      ...content.ai_compute_infra.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.ai_compute_infra.length;
  }
  if (content.fintech_regtech && content.fintech_regtech.length > 0) {
    allHeadlines.push(
      "\nFinTech & Payments:",
      ...content.fintech_regtech.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.fintech_regtech.length;
  }
  if (content.rpa_enterprise_ai && content.rpa_enterprise_ai.length > 0) {
    allHeadlines.push(
      "\nEnterprise AI & Automation:",
      ...content.rpa_enterprise_ai.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.rpa_enterprise_ai.length;
  }
  if (content.semi_supply_chain && content.semi_supply_chain.length > 0) {
    allHeadlines.push(
      "\nSemiconductor Supply Chain:",
      ...content.semi_supply_chain.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.semi_supply_chain.length;
  }
  if (content.cybersecurity && content.cybersecurity.length > 0) {
    allHeadlines.push(
      "\nCybersecurity:",
      ...content.cybersecurity.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.cybersecurity.length;
  }
  if (content.geopolitics && content.geopolitics.length > 0) {
    allHeadlines.push(
      "\nGeopolitics:",
      ...content.geopolitics.map((a) => `  - ${a.ticker}: ${a.headline}`)
    );
    totalArticles += content.geopolitics.length;
  }

  // If no actual articles were found, return a fallback
  if (totalArticles === 0) {
    console.log(`  No articles found for ${targetDate}, using fallback briefing`);
    return generateFallbackBriefing(targetDate);
  }

  console.log(`  Found ${totalArticles} articles for Gemini analysis`);

  const prompt = `You are a sharp, experienced Wall Street tech analyst writing your morning briefing. Your readers are sophisticated investors who track AI infrastructure, semiconductors, fintech, enterprise software, and cybersecurity.

Today is ${targetDate}. Based on today's headlines below, write a compelling 2-3 paragraph analysis (250-350 words) that:

1. Opens with the day's most significant market-moving story and why it matters
2. Draws connections between seemingly unrelated news items to reveal sector trends
3. Provides specific price targets, market cap impacts, or competitive implications where relevant
4. Names specific companies, products, and executives - no vague references
5. Ends with a forward-looking statement about what to watch this week
6. Sounds like a seasoned analyst who's seen market cycles, not an AI summary

AVOID: Generic phrases like "exciting developments", "significant progress", "continue to monitor", or "stay tuned". Be direct and opinionated.

TODAY'S HEADLINES:
${allHeadlines.join("\n")}

Write your analysis now. No headers, no bullet points, just sharp analytical prose that a portfolio manager would actually want to read.`;

  try {
    console.log(`  Calling Gemini API for briefing...`);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  Gemini API error (${response.status}):`, errorText);
      return generateFallbackBriefing(targetDate);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const briefing = data.candidates[0].content.parts[0].text.trim();
      console.log(`  Generated AI briefing successfully for ${targetDate} (${briefing.length} chars)`);
      return briefing;
    } else if (data.error) {
      console.error(`  Gemini API error:`, data.error.message || JSON.stringify(data.error));
      return generateFallbackBriefing(targetDate);
    } else {
      console.error("  Unexpected Gemini response structure:", JSON.stringify(data, null, 2));
      return generateFallbackBriefing(targetDate);
    }
  } catch (error: any) {
    console.error("  Failed to generate briefing with Gemini:", error.message);
    return generateFallbackBriefing(targetDate);
  }
}

function generateFallbackBriefing(targetDate: string): string {
  const date = new Date(targetDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `Tech news briefing for ${date}. Check the articles below for today's key developments across AI infrastructure, fintech, enterprise automation, semiconductors, and cybersecurity.`;
}

async function generateNewsForDate(targetDate: string): Promise<NewsDay & { analysis?: DailyAnalysis }> {
  const newsDay: NewsDay & { analysis?: DailyAnalysis } = {
    date: targetDate,
    content: {
      briefing: "",
      ai_compute_infra: [],
      fintech_regtech: [],
      rpa_enterprise_ai: [],
      semi_supply_chain: [],
      cybersecurity: [],
      geopolitics: [],
    },
  };

  console.log(`Fetching news for ${targetDate}...`);

  // For NewsAPI, we need to set the date range for that specific day
  const fromDate = targetDate;
  const toDate = targetDate;

  // Fetch news for each category - ONE API call per category (optimized for free tier)
  for (const [category, queries] of Object.entries(CATEGORIES)) {
    console.log(`  Fetching ${CATEGORY_NAMES[category]}...`);

    // Only one query per category now - pass category for RSS fallback
    const articles = await fetchNewsForCategory(queries[0], fromDate, toDate, category);
    (newsDay.content as any)[category] = articles.slice(0, 5); // Max 5 per category

    // Rate limiting - wait 500ms between category requests
    await delay(500);
  }

  // Check if we have any articles
  const allArticles: NewsArticle[] = [];
  const categories: Record<string, NewsArticle[]> = {};
  Object.keys(CATEGORIES).forEach(cat => {
    const catArticles = (newsDay.content as any)[cat] as NewsArticle[];
    if (catArticles.length > 0) {
      categories[cat] = catArticles;
      allArticles.push(...catArticles);
    }
  });

  // Run Market Intelligence analysis if enabled and we have articles
  if (ENABLE_MARKET_INTELLIGENCE && allArticles.length > 0) {
    console.log(`  Running Market Intelligence analysis...`);
    try {
      const analysis = await runMarketIntelligence(allArticles, categories, targetDate);
      newsDay.content.briefing = analysis.briefing;
      newsDay.analysis = analysis;
      console.log(`  Market Intelligence complete - ${analysis.trendReport.trends.length} trends, ${analysis.strategistReport.opportunities.length} opportunities`);
    } catch (error: any) {
      console.error(`  Market Intelligence failed:`, error.message);
      // Fallback to simple briefing
      console.log(`  Generating simple briefing as fallback...`);
      newsDay.content.briefing = await generateBriefingWithGemini(newsDay.content, targetDate);
    }
  } else {
    // Generate simple AI briefing if Market Intelligence is disabled
    console.log(`  Generating AI briefing with Gemini...`);
    newsDay.content.briefing = await generateBriefingWithGemini(newsDay.content, targetDate);
  }

  return newsDay;
}

export async function refreshNewsFeed(): Promise<{
  success: boolean;
  message: string;
  fetchedDates: string[];
}> {
  // Read existing news feed
  let newsFeed: NewsDay[] = [];
  try {
    const content = await fs.readFile(newsFeedPath, "utf-8");
    newsFeed = JSON.parse(content);
  } catch (err) {
    // File doesn't exist, start fresh
    newsFeed = [];
  }

  // Get the last 8 days
  const last8Days = getLastNDays(DAYS_TO_KEEP);
  console.log(`Checking last ${DAYS_TO_KEEP} days: ${last8Days.join(", ")}`);

  // Find existing dates in the feed
  const existingDates = new Set(newsFeed.map((item) => item.date));
  console.log(`Existing dates in feed: ${Array.from(existingDates).join(", ") || "none"}`);

  // Find missing dates (only within the last 8 days)
  const missingDates = last8Days.filter((date) => !existingDates.has(date));

  if (missingDates.length === 0) {
    console.log("All dates are up to date. No missing days to fetch.");
    return {
      success: true,
      message: "News is already up to date",
      fetchedDates: [],
    };
  }

  console.log(`Missing dates to fetch: ${missingDates.join(", ")}`);
  const fetchedDates: string[] = [];

  // Fetch news for each missing date
  for (const date of missingDates) {
    console.log(`\n--- Fetching news for ${date} ---`);
    try {
      const newsForDate = await generateNewsForDate(date);

      // Check if we got any actual news content
      const hasContent = Object.keys(CATEGORIES).some(
        (cat) => (newsForDate.content as any)[cat]?.length > 0
      );

      if (hasContent) {
        newsFeed.push(newsForDate);
        fetchedDates.push(date);
        console.log(`Added news for ${date}`);
      } else {
        console.log(`No news found for ${date}, skipping`);
      }

      // Rate limiting between days - wait 1 second
      await delay(1000);
    } catch (error: any) {
      console.error(`Failed to fetch news for ${date}:`, error.message);
    }
  }

  // Sort by date descending (newest first)
  newsFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Keep only the last 8 days worth of news (remove anything older)
  const cutoffDate = last8Days[last8Days.length - 1];
  newsFeed = newsFeed.filter((item) => item.date >= cutoffDate);

  // Save to file
  await fs.writeFile(newsFeedPath, JSON.stringify(newsFeed, null, 2));
  console.log(`\nNews feed saved to ${newsFeedPath}`);
  console.log(`Total news days: ${newsFeed.length}`);

  return {
    success: true,
    message: `Synced ${fetchedDates.length} missing day(s)`,
    fetchedDates,
  };
}

// Export Market Intelligence functions for API routes
export { getHistoricalAnalysis, getSentimentHistory };

// Get the latest market intelligence analysis
export async function getLatestMarketIntelligence(): Promise<{
  analysis: Awaited<ReturnType<typeof getHistoricalAnalysis>>[0] | null;
  sentimentHistory: Awaited<ReturnType<typeof getSentimentHistory>>;
}> {
  const [analyses, sentimentHistory] = await Promise.all([
    getHistoricalAnalysis(1),
    getSentimentHistory(30),
  ]);

  return {
    analysis: analyses[0] || null,
    sentimentHistory,
  };
}

// Get full market terminal data
export async function getMarketTerminalData(days: number = 7): Promise<{
  analyses: Awaited<ReturnType<typeof getHistoricalAnalysis>>;
  sentimentHistory: Awaited<ReturnType<typeof getSentimentHistory>>;
  categoryNames: typeof CATEGORY_NAMES;
}> {
  // Try Supabase first
  const [analyses, sentimentHistory] = await Promise.all([
    getHistoricalAnalysis(days),
    getSentimentHistory(days * 6), // ~6 categories per day
  ]);

  // If Supabase has data, return it
  if (analyses.length > 0) {
    return {
      analyses,
      sentimentHistory,
      categoryNames: CATEGORY_NAMES,
    };
  }

  // Fallback: Read from local news_feed.json and extract analysis data
  console.log("[Market Terminal] No Supabase data, falling back to local news_feed.json");
  try {
    const newsContent = await fs.readFile(newsFeedPath, "utf-8");
    const newsFeed = JSON.parse(newsContent) as Array<NewsDay & { analysis?: DailyAnalysis }>;

    // Convert news feed to analysis format
    const localAnalyses = newsFeed.slice(0, days).map(day => {
      if (day.analysis) {
        return {
          date: day.date,
          briefing: day.analysis.briefing || day.content.briefing,
          trendReport: day.analysis.trendReport,
          strategistReport: day.analysis.strategistReport,
        };
      }
      // If no analysis, create a basic one from the briefing
      return {
        date: day.date,
        briefing: day.content.briefing || `News briefing for ${day.date}`,
        trendReport: null,
        strategistReport: null,
      };
    });

    return {
      analyses: localAnalyses,
      sentimentHistory: [],
      categoryNames: CATEGORY_NAMES,
    };
  } catch (error) {
    console.error("[Market Terminal] Failed to read local news feed:", error);
    return {
      analyses: [],
      sentimentHistory: [],
      categoryNames: CATEGORY_NAMES,
    };
  }
}
