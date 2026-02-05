// =============================================================================
// INTELLIGENCE DASHBOARD TYPES
// Extends existing DailyBriefing types for causal visualization
// =============================================================================

// Re-export existing types from MarketTerminal for consistency
export interface EnrichedArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: {
    normalizedScore: number;
    label: string;
  };
  impactScore: number;
  geoTags: string[];
  topics: string[];
}

export interface ArticleCluster {
  id: string;
  topic: string;
  keywords: string[];
  articles: EnrichedArticle[];
  aggregateSentiment: number;
  aggregateImpact: number;
  articleCount: number;
  categories: string[];
}

export interface DailyBriefing {
  date: string;
  executiveSummary: string;
  topClusters: ArticleCluster[];
  gprIndex: {
    current: number;
    trend: 'rising' | 'falling' | 'stable';
    history: Array<{ date: string; value: number }>;
  };
  marketSentiment: {
    overall: number;
    byCategory: Record<string, number>;
    trend: string;
  };
  isEmpty?: boolean;
}

// Graph visualization types (derived from existing data)
export interface GraphNode {
  id: string;
  label: string;
  type: 'cluster' | 'article';
  sentiment: number;
  impact: number;
  keywords?: string[];
  source?: string;
  categories?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // Based on shared keywords/topics
}

// Component props
export interface CausalGraphProps {
  clusters: ArticleCluster[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export interface EntityPanelProps {
  cluster: ArticleCluster | null;
  onClose: () => void;
}
