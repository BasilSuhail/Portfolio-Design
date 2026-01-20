import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

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

const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DAYS_TO_KEEP = 8;

// Log API key status (not the actual keys for security)
console.log(`NEWS_API_KEY configured: ${NEWS_API_KEY ? "Yes" : "No"}`);
console.log(`GEMINI_API_KEY configured: ${GEMINI_API_KEY ? "Yes" : "No"}`);

const newsFeedPath = path.join(process.cwd(), "news_feed.json");

// Stock tickers and company names for each category
const CATEGORIES: Record<string, Array<{ ticker: string; query: string }>> = {
  ai_compute_infra: [
    { ticker: "NVDA", query: "NVIDIA stock OR NVIDIA GPU" },
    { ticker: "AMD", query: "AMD stock OR AMD chips" },
    { ticker: "GOOGL", query: "Google AI OR Alphabet stock" },
    { ticker: "MSFT", query: "Microsoft AI OR Microsoft Azure" },
    { ticker: "META", query: "Meta AI OR Meta stock" },
  ],
  fintech_regtech: [
    { ticker: "SQ", query: "Block Inc stock OR Square payments" },
    { ticker: "PYPL", query: "PayPal stock OR PayPal payments" },
    { ticker: "INTU", query: "Intuit stock OR TurboTax" },
    { ticker: "V", query: "Visa stock OR Visa payments" },
    { ticker: "MA", query: "Mastercard stock OR Mastercard payments" },
  ],
  rpa_enterprise_ai: [
    { ticker: "PATH", query: "UiPath stock OR UiPath automation" },
    { ticker: "NOW", query: "ServiceNow stock OR ServiceNow platform" },
    { ticker: "CRM", query: "Salesforce stock OR Salesforce CRM" },
  ],
  semi_supply_chain: [
    { ticker: "TSM", query: "TSMC stock OR Taiwan Semiconductor" },
    { ticker: "ASML", query: "ASML stock OR ASML lithography" },
    { ticker: "MU", query: "Micron stock OR Micron memory" },
    { ticker: "AMAT", query: "Applied Materials stock" },
  ],
  cybersecurity: [
    { ticker: "CRWD", query: "CrowdStrike stock OR CrowdStrike security" },
    { ticker: "PANW", query: "Palo Alto Networks stock" },
    { ticker: "ZS", query: "Zscaler stock OR Zscaler security" },
    { ticker: "FTNT", query: "Fortinet stock OR Fortinet security" },
  ],
};

const CATEGORY_NAMES: Record<string, string> = {
  ai_compute_infra: "AI Compute & Infra",
  fintech_regtech: "FinTech & RegTech",
  rpa_enterprise_ai: "RPA & Enterprise AI",
  semi_supply_chain: "Semiconductor Supply Chain",
  cybersecurity: "Cybersecurity",
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

async function fetchNewsForStock(
  stock: { ticker: string; query: string },
  fromDate: string,
  toDate: string
): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn("NEWS_API_KEY not set. Skipping news fetch.");
    return [];
  }

  const { ticker, query } = stock;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&from=${fromDate}&to=${toDate}&pageSize=5&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") {
      console.error(`Error fetching news for ${ticker}:`, data.message);
      return [];
    }

    return (data.articles || []).map((article: any) => ({
      ticker,
      headline: article.title,
      url: article.url,
      source: article.source.name,
    }));
  } catch (error: any) {
    console.error(`Failed to fetch news for ${ticker}:`, error.message);
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

async function generateNewsForDate(targetDate: string): Promise<NewsDay> {
  const newsDay: NewsDay = {
    date: targetDate,
    content: {
      briefing: "",
      ai_compute_infra: [],
      fintech_regtech: [],
      rpa_enterprise_ai: [],
      semi_supply_chain: [],
      cybersecurity: [],
    },
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
      (newsDay.content as any)[category].push(...articles.slice(0, 2)); // Max 2 per ticker

      // Rate limiting - wait 200ms between requests
      await delay(200);
    }

    // Limit to 5 articles per category
    (newsDay.content as any)[category] = (newsDay.content as any)[category].slice(0, 5);
  }

  // Generate AI briefing summary using Gemini
  console.log(`  Generating AI briefing with Gemini...`);
  newsDay.content.briefing = await generateBriefingWithGemini(newsDay.content, targetDate);

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
  console.log(`Existing dates in feed: ${[...existingDates].join(", ") || "none"}`);

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
