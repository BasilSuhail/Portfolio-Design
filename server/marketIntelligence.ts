/**
 * Market Intelligence - Multi-Agent Analysis System
 *
 * Agent 1 (Reader): Summarizes daily news
 * Agent 2 (Analyst): Detects cross-category trends
 * Agent 3 (Strategist): Scores opportunities and risks
 */

import { callGemini, parseGeminiJSON } from "./geminiPool";
import { supabase, isSupabaseConfigured } from "./supabase";

// Types for the analysis pipeline
export interface NewsArticle {
  ticker: string;
  headline: string;
  url: string;
  source: string;
  category: string;
}

export interface EnrichedArticle extends NewsArticle {
  sentiment_score: number; // -1 to 1
  impact_score: number; // 0-100
  key_entities: string[];
  trend_direction: "bullish" | "bearish" | "neutral";
}

export interface TrendReport {
  trends: Array<{
    name: string;
    sectors: string[];
    momentum: "accelerating" | "stable" | "decelerating";
    analysis: string;
    confidence: number;
  }>;
  crossCategoryInsights: string;
}

export interface StrategistReport {
  opportunities: Array<{
    category: string;
    score: number;
    insight: string;
    tickers: string[];
    timeHorizon: "short" | "medium" | "long";
  }>;
  risks: Array<{
    factor: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedSectors: string[];
    mitigation: string;
  }>;
  marketSentiment: {
    overall: number; // -100 to 100
    byCategory: Record<string, number>;
  };
}

export interface DailyAnalysis {
  date: string;
  briefing: string;
  trendReport: TrendReport;
  strategistReport: StrategistReport;
  enrichedArticles: EnrichedArticle[];
}

// Category mapping for cleaner display
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  ai_compute_infra: "AI & Compute Infrastructure",
  fintech_regtech: "FinTech & Payments",
  rpa_enterprise_ai: "Enterprise AI & Automation",
  semi_supply_chain: "Semiconductor Supply Chain",
  cybersecurity: "Cybersecurity",
  geopolitics: "Geopolitics",
  macro_finance: "Macro Finance",
};

/**
 * AGENT 1: The Reader
 * Analyzes individual articles and extracts structured data
 */
async function runReaderAgent(articles: NewsArticle[]): Promise<EnrichedArticle[]> {
  if (articles.length === 0) return [];

  console.log(`[Reader Agent] Analyzing ${articles.length} articles...`);

  // Batch articles for efficient processing
  const batchSize = 10;
  const enrichedArticles: EnrichedArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);

    const prompt = `You are a financial news analyst. Analyze these headlines and extract structured data.

For each headline, determine:
1. sentiment_score: -1.0 (very bearish) to 1.0 (very bullish)
2. impact_score: 0-100 (how market-moving is this news)
3. key_entities: company names, people, products mentioned
4. trend_direction: "bullish", "bearish", or "neutral"

Headlines to analyze:
${batch.map((a, idx) => `${idx + 1}. [${a.ticker}] ${a.headline}`).join("\n")}

Respond with a JSON array matching this structure:
[
  {
    "index": 1,
    "sentiment_score": 0.5,
    "impact_score": 75,
    "key_entities": ["NVIDIA", "Jensen Huang", "H100"],
    "trend_direction": "bullish"
  }
]

Be objective and data-driven. High impact scores (>70) should be reserved for major announcements, earnings surprises, or regulatory changes.`;

    try {
      const response = await callGemini(prompt, {
        agent: "reader",
        temperature: 0.3,
        maxOutputTokens: 1500,
      });

      const parsed = parseGeminiJSON<Array<{
        index: number;
        sentiment_score: number;
        impact_score: number;
        key_entities: string[];
        trend_direction: "bullish" | "bearish" | "neutral";
      }>>(response);

      if (parsed) {
        batch.forEach((article, idx) => {
          const analysis = parsed.find(p => p.index === idx + 1);
          enrichedArticles.push({
            ...article,
            sentiment_score: analysis?.sentiment_score ?? 0,
            impact_score: analysis?.impact_score ?? 50,
            key_entities: analysis?.key_entities ?? [],
            trend_direction: analysis?.trend_direction ?? "neutral",
          });
        });
      } else {
        // Fallback: add articles with default values
        batch.forEach(article => {
          enrichedArticles.push({
            ...article,
            sentiment_score: 0,
            impact_score: 50,
            key_entities: [],
            trend_direction: "neutral",
          });
        });
      }
    } catch (error: any) {
      console.error(`[Reader Agent] Batch ${i / batchSize + 1} failed:`, error.message);
      // Add articles with defaults on error
      batch.forEach(article => {
        enrichedArticles.push({
          ...article,
          sentiment_score: 0,
          impact_score: 50,
          key_entities: [],
          trend_direction: "neutral",
        });
      });
    }

    // Small delay between batches
    if (i + batchSize < articles.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[Reader Agent] Enriched ${enrichedArticles.length} articles`);
  return enrichedArticles;
}

/**
 * AGENT 2: The Analyst
 * Detects cross-category trends and patterns
 */
async function runAnalystAgent(
  enrichedArticles: EnrichedArticle[],
  briefing: string
): Promise<TrendReport> {
  console.log(`[Analyst Agent] Analyzing trends across ${enrichedArticles.length} articles...`);

  // Group articles by category for the prompt
  const byCategory: Record<string, EnrichedArticle[]> = {};
  enrichedArticles.forEach(article => {
    if (!byCategory[article.category]) {
      byCategory[article.category] = [];
    }
    byCategory[article.category].push(article);
  });

  // Calculate average sentiment per category
  const categorySentiments: Record<string, { avg: number; count: number }> = {};
  Object.entries(byCategory).forEach(([cat, articles]) => {
    const sum = articles.reduce((acc, a) => acc + a.sentiment_score, 0);
    categorySentiments[cat] = {
      avg: articles.length > 0 ? sum / articles.length : 0,
      count: articles.length,
    };
  });

  const prompt = `You are a cross-market analyst specializing in tech, finance, and geopolitics. Your job is to identify interconnected trends across sectors.

Today's briefing summary:
${briefing}

Sector data:
${Object.entries(byCategory).map(([cat, articles]) => {
  const displayName = CATEGORY_DISPLAY_NAMES[cat] || cat;
  const sentiment = categorySentiments[cat];
  const topHeadlines = articles.slice(0, 3).map(a => `  - ${a.headline}`).join("\n");
  return `${displayName} (Sentiment: ${(sentiment.avg * 100).toFixed(0)}%, ${sentiment.count} articles):
${topHeadlines}`;
}).join("\n\n")}

Identify 3-5 interconnected macro trends. Look for:
- Cause-and-effect chains across sectors (e.g., "AI chip demand → Taiwan tensions → Supply chain risk")
- Contradictions or tensions between sectors
- Emerging themes that span multiple categories

Respond with JSON:
{
  "trends": [
    {
      "name": "AI Infrastructure Arms Race",
      "sectors": ["ai_compute_infra", "semi_supply_chain"],
      "momentum": "accelerating",
      "analysis": "Your detailed analysis here (2-3 sentences)",
      "confidence": 85
    }
  ],
  "crossCategoryInsights": "A paragraph synthesizing the overall market picture"
}`;

  try {
    const response = await callGemini(prompt, {
      agent: "analyst",
      temperature: 0.6,
      maxOutputTokens: 2000,
    });

    const parsed = parseGeminiJSON<TrendReport>(response);

    if (parsed && parsed.trends) {
      console.log(`[Analyst Agent] Identified ${parsed.trends.length} trends`);
      return parsed;
    }
  } catch (error: any) {
    console.error(`[Analyst Agent] Failed:`, error.message);
  }

  // Fallback report
  return {
    trends: [{
      name: "Market Activity",
      sectors: Object.keys(byCategory),
      momentum: "stable",
      analysis: "Analysis temporarily unavailable. Review individual category headlines for insights.",
      confidence: 50,
    }],
    crossCategoryInsights: briefing || "Cross-category analysis temporarily unavailable.",
  };
}

/**
 * AGENT 3: The Strategist
 * Scores opportunities and identifies risks
 */
async function runStrategistAgent(
  enrichedArticles: EnrichedArticle[],
  trendReport: TrendReport
): Promise<StrategistReport> {
  console.log(`[Strategist Agent] Generating investment insights...`);

  // Group by category and calculate metrics
  const byCategory: Record<string, EnrichedArticle[]> = {};
  enrichedArticles.forEach(article => {
    if (!byCategory[article.category]) {
      byCategory[article.category] = [];
    }
    byCategory[article.category].push(article);
  });

  const categoryMetrics = Object.entries(byCategory).map(([cat, articles]) => {
    const avgSentiment = articles.reduce((acc, a) => acc + a.sentiment_score, 0) / articles.length;
    const avgImpact = articles.reduce((acc, a) => acc + a.impact_score, 0) / articles.length;
    const bullishCount = articles.filter(a => a.trend_direction === "bullish").length;
    const bearishCount = articles.filter(a => a.trend_direction === "bearish").length;
    const topTickers = Array.from(new Set(articles.map(a => a.ticker))).slice(0, 5);

    return {
      category: cat,
      displayName: CATEGORY_DISPLAY_NAMES[cat] || cat,
      avgSentiment,
      avgImpact,
      bullishCount,
      bearishCount,
      topTickers,
      articleCount: articles.length,
    };
  });

  const prompt = `You are an investment strategist. Based on today's market analysis, provide actionable insights.

Trend Analysis:
${trendReport.trends.map(t => `- ${t.name} (${t.momentum}): ${t.analysis}`).join("\n")}

Category Metrics:
${categoryMetrics.map(m =>
  `${m.displayName}: Sentiment ${(m.avgSentiment * 100).toFixed(0)}%, Impact ${m.avgImpact.toFixed(0)}, Bullish/Bearish ${m.bullishCount}/${m.bearishCount}, Tickers: ${m.topTickers.join(", ")}`
).join("\n")}

Cross-category insights: ${trendReport.crossCategoryInsights}

Provide your analysis as JSON:
{
  "opportunities": [
    {
      "category": "ai_compute_infra",
      "score": 85,
      "insight": "Specific actionable insight (2-3 sentences)",
      "tickers": ["NVDA", "AMD"],
      "timeHorizon": "medium"
    }
  ],
  "risks": [
    {
      "factor": "Specific risk factor",
      "severity": "high",
      "affectedSectors": ["semi_supply_chain", "ai_compute_infra"],
      "mitigation": "How to hedge or position"
    }
  ],
  "marketSentiment": {
    "overall": 25,
    "byCategory": {
      "ai_compute_infra": 60,
      "fintech_regtech": 10
    }
  }
}

Guidelines:
- Score opportunities 0-100 based on risk/reward
- Be specific about tickers and time horizons
- Risk severity: low (<20% impact), medium (20-50%), high (50-80%), critical (>80%)
- Overall sentiment ranges from -100 (extreme fear) to +100 (extreme greed)`;

  try {
    const response = await callGemini(prompt, {
      agent: "strategist",
      temperature: 0.5,
      maxOutputTokens: 2000,
    });

    const parsed = parseGeminiJSON<StrategistReport>(response);

    if (parsed && parsed.opportunities) {
      console.log(`[Strategist Agent] Generated ${parsed.opportunities.length} opportunities, ${parsed.risks?.length || 0} risks`);
      return parsed;
    }
  } catch (error: any) {
    console.error(`[Strategist Agent] Failed:`, error.message);
  }

  // Fallback report
  const overallSentiment = categoryMetrics.reduce((acc, m) => acc + m.avgSentiment, 0) / categoryMetrics.length;
  const byCategorySentiment: Record<string, number> = {};
  categoryMetrics.forEach(m => {
    byCategorySentiment[m.category] = Math.round(m.avgSentiment * 100);
  });

  return {
    opportunities: [],
    risks: [],
    marketSentiment: {
      overall: Math.round(overallSentiment * 100),
      byCategory: byCategorySentiment,
    },
  };
}

/**
 * Generate the daily briefing (existing functionality, enhanced)
 */
async function generateDailyBriefing(
  articles: NewsArticle[],
  date: string
): Promise<string> {
  if (articles.length === 0) {
    return `Market intelligence briefing for ${date}. No significant news to report today.`;
  }

  // Group by category
  const byCategory: Record<string, NewsArticle[]> = {};
  articles.forEach(article => {
    if (!byCategory[article.category]) {
      byCategory[article.category] = [];
    }
    byCategory[article.category].push(article);
  });

  const headlinesSummary = Object.entries(byCategory)
    .map(([cat, arts]) => {
      const displayName = CATEGORY_DISPLAY_NAMES[cat] || cat;
      return `${displayName}:\n${arts.slice(0, 3).map(a => `  - ${a.ticker}: ${a.headline}`).join("\n")}`;
    })
    .join("\n\n");

  const prompt = `You are a sharp, experienced Wall Street tech analyst writing your morning briefing. Your readers are sophisticated investors who track AI infrastructure, semiconductors, fintech, enterprise software, and cybersecurity.

Today is ${date}. Based on today's headlines below, write a compelling 2-3 paragraph analysis (250-350 words) that:

1. Opens with the day's most significant market-moving story and why it matters
2. Draws connections between seemingly unrelated news items to reveal sector trends
3. Provides specific price targets, market cap impacts, or competitive implications where relevant
4. Names specific companies, products, and executives - no vague references
5. Ends with a forward-looking statement about what to watch this week
6. Sounds like a seasoned analyst who's seen market cycles, not an AI summary

AVOID: Generic phrases like "exciting developments", "significant progress", "continue to monitor", or "stay tuned". Be direct and opinionated.

TODAY'S HEADLINES:
${headlinesSummary}

Write your analysis now. No headers, no bullet points, just sharp analytical prose that a portfolio manager would actually want to read.`;

  try {
    const response = await callGemini(prompt, {
      agent: "reader",
      temperature: 0.8,
      maxOutputTokens: 800,
    });
    return response;
  } catch (error: any) {
    console.error(`[Briefing] Failed:`, error.message);
    return `Market intelligence briefing for ${date}. Check the detailed analysis below for today's key developments.`;
  }
}

/**
 * Store analysis results in Supabase
 */
async function storeAnalysisInSupabase(
  date: string,
  analysis: DailyAnalysis
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("[Storage] Supabase not configured, skipping storage");
    return;
  }

  try {
    // Store enriched articles
    if (analysis.enrichedArticles.length > 0) {
      const articlesToInsert = analysis.enrichedArticles.map(a => ({
        date,
        category: a.category,
        ticker: a.ticker,
        headline: a.headline,
        url: a.url,
        source: a.source,
        sentiment_score: a.sentiment_score,
        impact_score: a.impact_score,
        key_entities: a.key_entities,
        trend_direction: a.trend_direction,
      }));

      const { error: articlesError } = await supabase
        .from("news_articles")
        .upsert(articlesToInsert, { onConflict: "id" });

      if (articlesError) {
        if (articlesError.message.includes("does not exist") || articlesError.code === "42P01") {
          console.warn("[Storage] news_articles table doesn't exist - run SQL setup to enable storage");
        } else {
          console.error("[Storage] Failed to store articles:", articlesError.message);
        }
      } else {
        console.log(`[Storage] Stored ${articlesToInsert.length} articles`);
      }
    }

    // Store daily analysis
    const { error: analysisError } = await supabase
      .from("daily_analysis")
      .upsert({
        date,
        briefing: analysis.briefing,
        trend_report: analysis.trendReport,
        opportunities: analysis.strategistReport.opportunities,
        risk_factors: analysis.strategistReport.risks,
        market_sentiment: analysis.strategistReport.marketSentiment,
      }, { onConflict: "date" });

    if (analysisError) {
      if (analysisError.message.includes("does not exist") || analysisError.code === "42P01") {
        console.warn("[Storage] daily_analysis table doesn't exist - run SQL setup to enable storage");
      } else {
        console.error("[Storage] Failed to store daily analysis:", analysisError.message);
      }
    } else {
      console.log(`[Storage] Stored daily analysis for ${date}`);
    }

    // Store sentiment history
    const categoryGroups: Record<string, EnrichedArticle[]> = {};
    analysis.enrichedArticles.forEach(a => {
      if (!categoryGroups[a.category]) categoryGroups[a.category] = [];
      categoryGroups[a.category].push(a);
    });

    const sentimentRecords = Object.entries(categoryGroups).map(([category, articles]) => {
      const avgSentiment = articles.reduce((acc, a) => acc + a.sentiment_score, 0) / articles.length;
      const topEntities = Array.from(new Set(articles.flatMap(a => a.key_entities))).slice(0, 5);

      // Determine momentum based on sentiment direction
      let momentum: "accelerating" | "stable" | "decelerating" = "stable";
      const bullishCount = articles.filter(a => a.trend_direction === "bullish").length;
      const bearishCount = articles.filter(a => a.trend_direction === "bearish").length;
      if (bullishCount > bearishCount * 1.5) momentum = "accelerating";
      else if (bearishCount > bullishCount * 1.5) momentum = "decelerating";

      return {
        date,
        category,
        avg_sentiment: avgSentiment,
        article_count: articles.length,
        top_topics: topEntities,
        trend_momentum: momentum,
      };
    });

    if (sentimentRecords.length > 0) {
      const { error: sentimentError } = await supabase
        .from("sentiment_history")
        .upsert(sentimentRecords, { onConflict: "date,category" });

      if (sentimentError) {
        if (sentimentError.message.includes("does not exist") || sentimentError.code === "42P01") {
          console.warn("[Storage] sentiment_history table doesn't exist - run SQL setup to enable storage");
        } else {
          console.error("[Storage] Failed to store sentiment history:", sentimentError.message);
        }
      } else {
        console.log(`[Storage] Stored sentiment history for ${sentimentRecords.length} categories`);
      }
    }
  } catch (error: any) {
    console.error("[Storage] Error storing analysis:", error.message);
  }
}

/**
 * Main entry point: Run full analysis pipeline
 */
export async function runMarketIntelligence(
  rawArticles: Array<{ ticker: string; headline: string; url: string; source: string }>,
  categories: Record<string, Array<{ ticker: string; headline: string; url: string; source: string }>>,
  date: string
): Promise<DailyAnalysis> {
  console.log(`\n========================================`);
  console.log(`[Market Intelligence] Starting analysis for ${date}`);
  console.log(`========================================\n`);

  // Flatten articles with category info
  const allArticles: NewsArticle[] = [];
  Object.entries(categories).forEach(([category, articles]) => {
    articles.forEach(a => {
      allArticles.push({ ...a, category });
    });
  });

  console.log(`[Market Intelligence] Total articles to analyze: ${allArticles.length}`);

  // Step 1: Generate daily briefing
  console.log(`\n--- Step 1: Generating Daily Briefing ---`);
  const briefing = await generateDailyBriefing(allArticles, date);

  // Step 2: Run Reader Agent (enrich articles with sentiment/entities)
  console.log(`\n--- Step 2: Running Reader Agent ---`);
  const enrichedArticles = await runReaderAgent(allArticles);

  // Step 3: Run Analyst Agent (detect trends)
  console.log(`\n--- Step 3: Running Analyst Agent ---`);
  const trendReport = await runAnalystAgent(enrichedArticles, briefing);

  // Step 4: Run Strategist Agent (opportunities/risks)
  console.log(`\n--- Step 4: Running Strategist Agent ---`);
  const strategistReport = await runStrategistAgent(enrichedArticles, trendReport);

  // Compile final analysis
  const analysis: DailyAnalysis = {
    date,
    briefing,
    trendReport,
    strategistReport,
    enrichedArticles,
  };

  // Step 5: Store in Supabase
  console.log(`\n--- Step 5: Storing Results ---`);
  await storeAnalysisInSupabase(date, analysis);

  console.log(`\n========================================`);
  console.log(`[Market Intelligence] Analysis complete for ${date}`);
  console.log(`  - Briefing: ${briefing.length} chars`);
  console.log(`  - Trends: ${trendReport.trends.length}`);
  console.log(`  - Opportunities: ${strategistReport.opportunities.length}`);
  console.log(`  - Risks: ${strategistReport.risks.length}`);
  console.log(`  - Overall Sentiment: ${strategistReport.marketSentiment.overall}`);
  console.log(`========================================\n`);

  return analysis;
}

/**
 * Get historical analysis from Supabase
 */
export async function getHistoricalAnalysis(days: number = 7): Promise<Array<{
  date: string;
  briefing: string;
  trendReport: TrendReport | null;
  strategistReport: StrategistReport | null;
}>> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log("[Storage] Supabase not configured");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("daily_analysis")
      .select("*")
      .order("date", { ascending: false })
      .limit(days);

    if (error) {
      // Check if it's a "table doesn't exist" error
      if (error.message.includes("does not exist") || error.code === "42P01" || error.code === "PGRST116") {
        console.log("[Storage] daily_analysis table doesn't exist yet - run the SQL setup");
        return [];
      }
      console.error("[Storage] Failed to fetch historical analysis:", error.message);
      return [];
    }

    return (data || []).map(row => ({
      date: row.date,
      briefing: row.briefing || "",
      trendReport: row.trend_report ? (typeof row.trend_report === 'string' ? JSON.parse(row.trend_report) : row.trend_report) : null,
      strategistReport: row.opportunities ? {
        opportunities: row.opportunities,
        risks: row.risk_factors || [],
        marketSentiment: row.market_sentiment || { overall: 0, byCategory: {} },
      } : null,
    }));
  } catch (error: any) {
    console.error("[Storage] Error fetching historical analysis:", error.message);
    return [];
  }
}

/**
 * Get sentiment history for charts
 */
export async function getSentimentHistory(days: number = 30): Promise<Array<{
  date: string;
  category: string;
  avg_sentiment: number;
  article_count: number;
  trend_momentum: string;
}>> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("sentiment_history")
      .select("*")
      .order("date", { ascending: false })
      .limit(days * 6); // ~6 categories per day

    if (error) {
      // Check if it's a "table doesn't exist" error
      if (error.message.includes("does not exist") || error.code === "42P01" || error.code === "PGRST116") {
        console.log("[Storage] sentiment_history table doesn't exist yet - run the SQL setup");
        return [];
      }
      console.error("[Storage] Failed to fetch sentiment history:", error.message);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error("[Storage] Error fetching sentiment history:", error.message);
    return [];
  }
}
