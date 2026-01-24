/**
 * Market Intelligence Platform - SQLite Storage Layer
 *
 * Provides persistent storage for articles, clusters, and briefings.
 * Uses better-sqlite3 for high performance and zero-configuration.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  RawArticle,
  EnrichedArticle,
  ArticleCluster,
  DailyBriefing,
  GPRDataPoint,
  ArticleCategory,
  GPRIndex
} from './types';

class IntelligenceStorage {
  private db: Database.Database;
  private cacheDir: string;

  constructor() {
    // Use same directory as newsService.ts for consistency
    this.cacheDir = process.env.NEWS_FEED_DIR || process.cwd();
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    const dbPath = path.join(this.cacheDir, 'intelligence.db');
    console.log(`[Storage] Database path: ${dbPath}`);
    this.db = new Database(dbPath);

    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');

    this.initializeSchema();
    console.log(`[Storage] Database initialized successfully`);
  }

  /**
   * Initialize the SQLite schema
   */
  private initializeSchema() {
    this.db.exec(`
      -- Raw articles table
      CREATE TABLE IF NOT EXISTS raw_articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        url TEXT UNIQUE,
        source TEXT,
        source_id TEXT,
        published_at TEXT,
        category TEXT,
        ticker TEXT,
        provider TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Enriched articles table
      CREATE TABLE IF NOT EXISTS enriched_articles (
        id TEXT PRIMARY KEY,
        raw_article_id TEXT REFERENCES raw_articles(id) ON DELETE CASCADE,
        sentiment_score REAL,
        sentiment_label TEXT,
        sentiment_confidence REAL,
        sentiment_method TEXT,
        impact_score REAL,
        geo_tags TEXT, -- JSON array
        topics TEXT,   -- JSON array
        cluster_id TEXT,
        enriched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Clusters table
      CREATE TABLE IF NOT EXISTS clusters (
        id TEXT PRIMARY KEY,
        date TEXT,
        topic TEXT,
        keywords TEXT, -- JSON array
        aggregate_sentiment REAL,
        aggregate_impact REAL,
        article_count INTEGER,
        categories TEXT, -- JSON array
        earliest_date TEXT,
        latest_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Daily briefings table
      CREATE TABLE IF NOT EXISTS daily_briefings (
        date TEXT PRIMARY KEY,
        executive_summary TEXT,
        cache_hash TEXT,
        source TEXT,
        gpr_index REAL,
        market_sentiment REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- GPR Index tracking
      CREATE TABLE IF NOT EXISTS gpr_history (
        date TEXT PRIMARY KEY,
        score REAL,
        keyword_counts TEXT, -- JSON object
        top_keywords TEXT,    -- JSON array
        article_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_raw_published ON raw_articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_raw_category ON raw_articles(category);
      CREATE INDEX IF NOT EXISTS idx_enriched_impact ON enriched_articles(impact_score);
      CREATE INDEX IF NOT EXISTS idx_enriched_cluster ON enriched_articles(cluster_id);
    `);

    // Run migrations for existing databases that might be missing columns
    this.runMigrations();
  }

  /**
   * Run schema migrations for existing databases
   * SQLite doesn't update tables with CREATE TABLE IF NOT EXISTS,
   * so we need to manually add missing columns
   */
  private runMigrations() {
    console.log('[Storage] Checking for schema migrations...');

    // Get existing columns in raw_articles
    const columns = this.db.prepare("PRAGMA table_info(raw_articles)").all() as any[];
    const columnNames = new Set(columns.map((c: any) => c.name));

    // Add missing columns to raw_articles
    const requiredColumns = [
      { name: 'ticker', type: 'TEXT' },
      { name: 'provider', type: 'TEXT' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'source_id', type: 'TEXT' }
    ];

    for (const col of requiredColumns) {
      if (!columnNames.has(col.name)) {
        console.log(`[Storage] Adding missing column: raw_articles.${col.name}`);
        try {
          this.db.exec(`ALTER TABLE raw_articles ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) {
          // Column might already exist, ignore error
          console.log(`[Storage] Column ${col.name} already exists or error:`, e);
        }
      }
    }

    console.log('[Storage] Schema migrations complete');
  }

  // ===========================================================================
  // ARTICLE OPERATIONS
  // ===========================================================================

  /**
   * Save raw articles in batch
   */
  saveRawArticles(articles: RawArticle[]): void {
    const upsert = this.db.prepare(`
      INSERT INTO raw_articles (
        id, title, description, content, url, source, source_id, 
        published_at, category, ticker, provider, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        content = excluded.content
    `);

    const transaction = this.db.transaction((items: RawArticle[]) => {
      for (const article of items) {
        upsert.run(
          article.id,
          article.title,
          article.description,
          article.content,
          article.url,
          article.source,
          article.sourceId,
          article.publishedAt,
          article.category,
          article.ticker,
          article.provider,
          article.imageUrl || null
        );
      }
    });

    transaction(articles);
  }

  /**
   * Save enriched articles
   */
  saveEnrichedArticles(articles: EnrichedArticle[]): void {
    const upsert = this.db.prepare(`
      INSERT INTO enriched_articles (
        id, raw_article_id, sentiment_score, sentiment_label, 
        sentiment_confidence, sentiment_method, impact_score, 
        geo_tags, topics, cluster_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sentiment_score = excluded.sentiment_score,
        sentiment_label = excluded.sentiment_label,
        impact_score = excluded.impact_score,
        cluster_id = excluded.cluster_id
    `);

    const transaction = this.db.transaction((items: EnrichedArticle[]) => {
      for (const article of items) {
        upsert.run(
          article.id,
          article.id, // Assuming same ID as raw for now or linked
          article.sentiment.score,
          article.sentiment.label,
          article.sentiment.confidence,
          article.sentiment.method,
          article.impactScore,
          JSON.stringify(article.geoTags),
          JSON.stringify(article.topics),
          article.clusterId || null
        );
      }
    });

    transaction(articles);
  }

  /**
   * Get recently published raw articles that haven't been enriched yet
   */
  getUnenrichedArticles(limit = 100): RawArticle[] {
    const rows = this.db.prepare(`
      SELECT r.* FROM raw_articles r
      LEFT JOIN enriched_articles e ON r.id = e.raw_article_id
      WHERE e.id IS NULL
      ORDER BY r.published_at DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      url: row.url,
      source: row.source,
      sourceId: row.source_id,
      publishedAt: row.published_at,
      category: row.category as ArticleCategory,
      ticker: row.ticker,
      provider: row.provider as any,
      imageUrl: row.image_url
    }));
  }

  // ===========================================================================
  // CLUSTER OPERATIONS
  // ===========================================================================

  saveClusters(clusters: ArticleCluster[]): void {
    const upsert = this.db.prepare(`
      INSERT INTO clusters (
        id, date, topic, keywords, aggregate_sentiment, 
        aggregate_impact, article_count, categories, 
        earliest_date, latest_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        topic = excluded.topic,
        aggregate_sentiment = excluded.aggregate_sentiment,
        aggregate_impact = excluded.aggregate_impact,
        article_count = excluded.article_count
    `);

    const transaction = this.db.transaction((items: ArticleCluster[]) => {
      for (const cluster of items) {
        upsert.run(
          cluster.id,
          cluster.dateRange.latest.split('T')[0],
          cluster.topic,
          JSON.stringify(cluster.keywords),
          cluster.aggregateSentiment,
          cluster.aggregateImpact,
          cluster.articleCount,
          JSON.stringify(cluster.categories),
          cluster.dateRange.earliest,
          cluster.dateRange.latest
        );
      }
    });

    transaction(clusters);
  }

  // ===========================================================================
  // BRIEFING OPERATIONS
  // ===========================================================================

  saveBriefing(briefing: DailyBriefing): void {
    console.log(`[Storage] Saving briefing for ${briefing.date} (source: ${briefing.source})`);
    try {
      this.db.prepare(`
        INSERT INTO daily_briefings (
          date, executive_summary, cache_hash, source, gpr_index, market_sentiment
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          executive_summary = excluded.executive_summary,
          cache_hash = excluded.cache_hash,
          source = excluded.source
      `).run(
        briefing.date,
        briefing.executiveSummary,
        briefing.cacheHash,
        briefing.source,
        briefing.gprIndex.current,
        briefing.marketSentiment.overall
      );
      console.log(`[Storage] Briefing saved successfully for ${briefing.date}`);
    } catch (error) {
      console.error(`[Storage] Failed to save briefing for ${briefing.date}:`, error);
      throw error;
    }
  }

  getBriefing(date: string): DailyBriefing | null {
    console.log(`[Storage] Getting briefing for ${date}`);
    const row = this.db.prepare('SELECT * FROM daily_briefings WHERE date = ?').get(date) as any;
    if (!row) {
      console.log(`[Storage] No briefing found for ${date}`);
      return null;
    }
    console.log(`[Storage] Found briefing for ${date}`);

    const gprIndex = this.getGPRIndex(date);

    return {
      date: row.date,
      executiveSummary: row.executive_summary,
      topClusters: this.getClustersByDate(date),
      gprIndex,
      marketSentiment: {
        overall: row.market_sentiment,
        byCategory: {},
        trend: row.market_sentiment > 10 ? 'bullish' : row.market_sentiment < -10 ? 'bearish' : 'neutral',
        confidence: 0.8
      },
      generatedAt: row.created_at,
      cacheHash: row.cache_hash,
      source: row.source as any
    };
  }

  /**
   * Get GPR history for a range
   */
  getGPRHistory(limit = 30): GPRDataPoint[] {
    const rows = this.db.prepare('SELECT * FROM gpr_history ORDER BY date DESC LIMIT ?').all(limit) as any[];
    return rows.map(row => ({
      date: row.date,
      score: row.score,
      keywordCounts: JSON.parse(row.keyword_counts),
      topKeywords: JSON.parse(row.top_keywords),
      articleCount: row.article_count
    }));
  }

  /**
   * Get clusters for a specific date
   */
  getClustersByDate(date: string): ArticleCluster[] {
    const rows = this.db.prepare('SELECT * FROM clusters WHERE date = ? ORDER BY aggregate_impact DESC').all(date) as any[];
    return rows.map(row => ({
      id: row.id,
      topic: row.topic,
      keywords: JSON.parse(row.keywords),
      articles: this.getEnrichedArticlesByCluster(row.id),
      aggregateSentiment: row.aggregate_sentiment,
      aggregateImpact: row.aggregate_impact,
      articleCount: row.article_count,
      categories: JSON.parse(row.categories),
      dateRange: {
        earliest: row.earliest_date,
        latest: row.latest_date
      }
    }));
  }

  /**
   * Get enriched articles for a cluster
   */
  getEnrichedArticlesByCluster(clusterId: string): EnrichedArticle[] {
    const rows = this.db.prepare(`
      SELECT e.*, r.* FROM enriched_articles e
      JOIN raw_articles r ON e.raw_article_id = r.id
      WHERE e.cluster_id = ?
      ORDER BY e.impact_score DESC
    `).all(clusterId) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      url: row.url,
      source: row.source,
      sourceId: row.source_id,
      publishedAt: row.published_at,
      category: row.category as ArticleCategory,
      ticker: row.ticker,
      provider: row.provider as any,
      imageUrl: row.image_url,
      sentiment: {
        score: row.sentiment_score,
        normalizedScore: Math.round(row.sentiment_score * 100),
        confidence: row.sentiment_confidence,
        label: row.sentiment_label as any,
        method: row.sentiment_method as any
      },
      impactScore: row.impact_score,
      geoTags: JSON.parse(row.geo_tags),
      topics: JSON.parse(row.topics),
      clusterId: row.cluster_id
    }));
  }

  /**
   * Get GPR Index for a date
   */
  private getGPRIndex(date: string): GPRIndex {
    const history = this.getGPRHistory(14);
    const current = history.find(h => h.date === date);

    return {
      current: current?.score || 0,
      trend: 'stable',
      percentChange7d: 0,
      history: history
    };
  }

  /**
   * Save GPR history point
   */
  saveGPRPoint(point: GPRDataPoint): void {
    this.db.prepare(`
      INSERT INTO gpr_history (date, score, keyword_counts, top_keywords, article_count)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        score = excluded.score,
        keyword_counts = excluded.keyword_counts,
        top_keywords = excluded.top_keywords,
        article_count = excluded.article_count
    `).run(
      point.date,
      point.score,
      JSON.stringify(point.keywordCounts),
      JSON.stringify(point.topKeywords),
      point.articleCount
    );
  }
}

export const storage = new IntelligenceStorage();
