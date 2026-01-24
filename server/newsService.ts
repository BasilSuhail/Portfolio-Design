import fs from "fs/promises";
import path from "path";
import { pipeline } from "./intelligence/core/pipeline";
import { storage } from "./intelligence/core/storage";
import { DailyAnalysis } from "./intelligence/core/types";

// ============================================
// Legacy Wrapper for newsService.ts
// ============================================

const newsFeedDir = process.env.NEWS_FEED_DIR || process.cwd();
const newsFeedPath = path.join(newsFeedDir, "news_feed.json");

/**
 * Runs the full intelligence pipeline and returns the result.
 * Maintains compatibility with existing refresh logic.
 */
export async function refreshNewsFeed(): Promise<{
  success: boolean;
  message: string;
  fetchedDates: string[];
}> {
  console.log("[NewsService] Starting modular pipeline refresh...");

  try {
    const analysis = await pipeline.run();

    // Maintain news_feed.json for backward compatibility with frontend parts 
    // that haven't been migrated yet to the new API.
    await updateLegacyFeed(analysis);

    return {
      success: true,
      message: `Synced ${analysis.metadata.articlesProcessed} articles across ${analysis.metadata.clustersFound} topics.`,
      fetchedDates: [analysis.date]
    };
  } catch (error: any) {
    console.error("[NewsService] Pipeline refresh failed:", error);
    return {
      success: false,
      message: error.message,
      fetchedDates: []
    };
  }
}

/**
 * Updates the legacy news_feed.json file to keep old UI working
 */
async function updateLegacyFeed(analysis: DailyAnalysis) {
  try {
    let feed: any[] = [];
    try {
      const content = await fs.readFile(newsFeedPath, "utf-8");
      feed = JSON.parse(content);
    } catch {
      feed = [];
    }

    // Convert new analysis format to old NewsDay format
    const legacyDay = {
      date: analysis.date,
      content: {
        briefing: analysis.briefing.executiveSummary,
        ai_compute_infra: analysis.enrichedArticles.filter(a => a.category === 'ai_compute_infra').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
        fintech_regtech: analysis.enrichedArticles.filter(a => a.category === 'fintech_regtech').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
        rpa_enterprise_ai: analysis.enrichedArticles.filter(a => a.category === 'rpa_enterprise_ai').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
        semi_supply_chain: analysis.enrichedArticles.filter(a => a.category === 'semiconductor').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
        cybersecurity: analysis.enrichedArticles.filter(a => a.category === 'cybersecurity').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
        geopolitics: analysis.enrichedArticles.filter(a => a.category === 'geopolitics').slice(0, 5).map(a => ({ ticker: a.ticker, headline: a.title, url: a.url, source: a.source })),
      }
    };

    // Upsert by date
    const index = feed.findIndex(d => d.date === analysis.date);
    if (index !== -1) feed[index] = legacyDay;
    else feed.unshift(legacyDay);

    await fs.writeFile(newsFeedPath, JSON.stringify(feed.slice(0, 365), null, 2));
    console.log("[NewsService] Legacy feed updated.");
  } catch (error) {
    console.error("[NewsService] Failed to update legacy feed:", error);
  }
}

/**
 * Backward compatibility exports
 */
export async function getLatestMarketIntelligence() {
  const date = new Date().toISOString().split('T')[0];
  const briefing = storage.getBriefing(date);
  return {
    analysis: briefing,
    sentimentHistory: [] // To be implemented via storage lookup
  };
}

export async function getMarketTerminalData(days: number = 7) {
  // Logic to pull from storage
  return {
    analyses: [],
    sentimentHistory: [],
    categoryNames: {
      ai_compute_infra: "AI Compute & Infra",
      fintech_regtech: "FinTech & RegTech",
      rpa_enterprise_ai: "RPA & Enterprise AI",
      semiconductor: "Semiconductor Supply Chain",
      cybersecurity: "Cybersecurity",
      geopolitics: "Geopolitics",
    }
  };
}

// These are still used by routes.ts but will be migrated to intelligence routes
export async function getHistoricalAnalysis(days: number) { return []; }
export async function getSentimentHistory(days: number) { return []; }
