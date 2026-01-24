/**
 * Market Intelligence Platform - Core Types
 *
 * These types define the data structures that flow through the pipeline:
 * Ingestion → Enrichment → Clustering → Synthesis
 */

// =============================================================================
// ARTICLE TYPES
// =============================================================================

/**
 * Raw article from any data source (NewsAPI, RSS, GDELT, etc.)
 */
export interface RawArticle {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  source: string;
  sourceId: string;
  publishedAt: string;
  category: ArticleCategory;
  provider: DataProvider;
  imageUrl?: string;
}

/**
 * Article enriched with sentiment, impact score, and tags
 */
export interface EnrichedArticle extends RawArticle {
  sentiment: SentimentScore;
  impactScore: number; // 0-100
  geoTags: string[]; // e.g., ["sanctions", "trade-war", "china"]
  topics: string[]; // Extracted key topics
  clusterId?: string; // Assigned after clustering
}

/**
 * Supported article categories
 */
export type ArticleCategory =
  | 'ai_compute_infra'
  | 'fintech_regtech'
  | 'rpa_enterprise_ai'
  | 'semiconductor'
  | 'cybersecurity'
  | 'geopolitics';

/**
 * Data provider identifiers
 */
export type DataProvider = 'newsapi' | 'rss' | 'gdelt' | 'sec';

// =============================================================================
// SENTIMENT TYPES
// =============================================================================

export interface SentimentScore {
  score: number; // -1 to 1 (FinBERT scale)
  normalizedScore: number; // -100 to 100 (display scale)
  confidence: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  method: 'finbert' | 'local' | 'hybrid';
}

// =============================================================================
// IMPACT SCORING TYPES
// =============================================================================

export interface ImpactFactors {
  sentimentMagnitude: number; // |sentiment| - high volatility = high impact
  clusterSize: number; // Number of articles in same cluster
  sourceWeight: number; // Source credibility multiplier
  recency: number; // Time decay factor
}

export interface SourceWeights {
  [sourceId: string]: number; // e.g., { "reuters": 1.2, "random-blog": 0.8 }
}

// =============================================================================
// CLUSTERING TYPES
// =============================================================================

export interface ArticleCluster {
  id: string;
  topic: string; // e.g., "NVIDIA Earnings Beat"
  keywords: string[];
  articles: EnrichedArticle[];
  aggregateSentiment: number;
  aggregateImpact: number;
  articleCount: number;
  categories: ArticleCategory[];
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export interface ClusteringResult {
  clusters: ArticleCluster[];
  outliers: EnrichedArticle[]; // Articles that didn't fit any cluster
  method: 'bertopic' | 'tfidf-kmeans' | 'keyword';
  timestamp: string;
}

// =============================================================================
// GEOPOLITICAL RISK INDEX (GPR) TYPES
// =============================================================================

export interface GPRDataPoint {
  date: string;
  score: number; // 0-100 risk level
  keywordCounts: { [keyword: string]: number };
  topKeywords: string[];
  articleCount: number;
}

export interface GPRIndex {
  current: number;
  trend: 'rising' | 'falling' | 'stable';
  percentChange7d: number;
  history: GPRDataPoint[];
}

// =============================================================================
// SYNTHESIS TYPES
// =============================================================================

export interface DailyBriefing {
  date: string;
  executiveSummary: string; // 250-350 words, Gemini-generated
  topClusters: ArticleCluster[];
  gprIndex: GPRIndex;
  marketSentiment: MarketSentiment;
  generatedAt: string;
  cacheHash: string; // For idempotence
  source: 'gemini' | 'local-fallback';
}

export interface MarketSentiment {
  overall: number; // -100 to 100
  byCategory: { [key in ArticleCategory]?: number };
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

// =============================================================================
// ANALYSIS TYPES (Combined Output)
// =============================================================================

export interface DailyAnalysis {
  date: string;
  briefing: DailyBriefing;
  clusters: ClusteringResult;
  enrichedArticles: EnrichedArticle[];
  gprIndex: GPRIndex;
  opportunities: Opportunity[];
  risks: Risk[];
  metadata: AnalysisMetadata;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  relatedClusters: string[];
  categories: ArticleCategory[];
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedClusters: string[];
  categories: ArticleCategory[];
}

export interface AnalysisMetadata {
  articlesProcessed: number;
  clustersFound: number;
  apiCallsMade: number;
  processingTimeMs: number;
  cacheHit: boolean;
  errors: string[];
}

// =============================================================================
// PROVIDER INTERFACES
// =============================================================================

/**
 * Interface for data providers (NewsAPI, RSS, GDELT, etc.)
 */
export interface DataProviderInterface {
  name: DataProvider;
  isAvailable(): Promise<boolean>;
  fetchArticles(options: FetchOptions): Promise<RawArticle[]>;
  getRateLimitStatus(): RateLimitStatus;
}

export interface FetchOptions {
  categories?: ArticleCategory[];
  dateFrom?: string;
  dateTo?: string;
  maxArticles?: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

// =============================================================================
// CACHE TYPES
// =============================================================================

export interface CacheEntry<T> {
  data: T;
  hash: string;
  createdAt: string;
  expiresAt: string;
}

export interface CacheConfig {
  ttlMs: number;
  maxEntries: number;
  persistToDisk: boolean;
}

// =============================================================================
// USER FEEDBACK TYPES (Evaluation Hooks)
// =============================================================================

export interface UserFeedback {
  id: string;
  articleId: string;
  headline: string;
  predictedSentiment: number;
  userCorrection: 'positive' | 'negative' | 'neutral';
  timestamp: string;
  category: ArticleCategory;
}

export interface FeedbackStats {
  totalFeedback: number;
  agreementRate: number;
  commonCorrections: { predicted: string; corrected: string; count: number }[];
}

// =============================================================================
// PIPELINE CONFIGURATION
// =============================================================================

export interface PipelineConfig {
  // Ingestion
  enabledProviders: DataProvider[];
  fetchIntervalMs: number;
  maxArticlesPerFetch: number;

  // Enrichment
  sentimentMethod: 'finbert' | 'local' | 'hybrid';
  enableGeoTagging: boolean;

  // Clustering
  clusteringMethod: 'bertopic' | 'tfidf-kmeans' | 'keyword';
  minClusterSize: number;

  // Synthesis
  enableGeminiSynthesis: boolean;
  cacheEnabled: boolean;
  cacheTtlMs: number;

  // Storage
  retentionDays: number;
  enableSupabaseBackup: boolean;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  enabledProviders: ['newsapi', 'rss'],
  fetchIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
  maxArticlesPerFetch: 100,
  sentimentMethod: 'hybrid',
  enableGeoTagging: true,
  clusteringMethod: 'tfidf-kmeans', // Fallback, BERTopic preferred
  minClusterSize: 3,
  enableGeminiSynthesis: true,
  cacheEnabled: true,
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  retentionDays: 365,
  enableSupabaseBackup: false,
};
