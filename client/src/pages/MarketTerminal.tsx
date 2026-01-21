import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useContent } from "@/hooks/use-content";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// Types for Market Intelligence data
interface TrendReport {
  trends: Array<{
    name: string;
    sectors: string[];
    momentum: "accelerating" | "stable" | "decelerating";
    analysis: string;
    confidence: number;
  }>;
  crossCategoryInsights: string;
}

interface StrategistReport {
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
    overall: number;
    byCategory: Record<string, number>;
  };
}

interface DailyAnalysis {
  date: string;
  briefing: string;
  trendReport: TrendReport | null;
  strategistReport: StrategistReport | null;
}

interface SentimentHistory {
  date: string;
  category: string;
  avg_sentiment: number;
  article_count: number;
  trend_momentum: string;
}

interface MarketTerminalData {
  analyses: DailyAnalysis[];
  sentimentHistory: SentimentHistory[];
  categoryNames: Record<string, string>;
}

// Category colors for charts
const CATEGORY_COLORS: Record<string, string> = {
  ai_compute_infra: "#8b5cf6",
  fintech_regtech: "#10b981",
  rpa_enterprise_ai: "#f59e0b",
  semi_supply_chain: "#3b82f6",
  cybersecurity: "#ef4444",
  geopolitics: "#ec4899",
};

// Severity colors
const SEVERITY_COLORS: Record<string, string> = {
  low: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  medium: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
  high: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  critical: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
};

// Momentum icons
const MomentumIcon = ({ momentum }: { momentum: string }) => {
  switch (momentum) {
    case "accelerating":
      return <TrendingUp className="size-4 text-green-500" />;
    case "decelerating":
      return <TrendingDown className="size-4 text-red-500" />;
    default:
      return <Minus className="size-4 text-gray-400" />;
  }
};

// Sentiment gauge component
const SentimentGauge = ({ value, label }: { value: number; label: string }) => {
  const getColor = (v: number) => {
    if (v >= 50) return "text-green-500";
    if (v >= 20) return "text-emerald-400";
    if (v >= -20) return "text-gray-400";
    if (v >= -50) return "text-orange-400";
    return "text-red-500";
  };

  const getLabel = (v: number) => {
    if (v >= 50) return "Bullish";
    if (v >= 20) return "Optimistic";
    if (v >= -20) return "Neutral";
    if (v >= -50) return "Cautious";
    return "Bearish";
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${getColor(value)}`}>
        {value > 0 ? "+" : ""}{value}
      </div>
      <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
        {getLabel(value)}
      </div>
      <div className="text-xs text-gray-400 dark:text-neutral-600">
        {label}
      </div>
    </div>
  );
};

export default function MarketTerminal() {
  const [data, setData] = useState<MarketTerminalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedTrend, setExpandedTrend] = useState<number | null>(null);
  const [expandedOpp, setExpandedOpp] = useState<number | null>(null);
  const { data: content } = useContent();

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/market-terminal?days=7");
        if (!res.ok) throw new Error("Failed to fetch market terminal data");
        const terminalData = await res.json();
        setData(terminalData);
        setError(false);
      } catch (e) {
        console.error("Market Terminal fetch error:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Extract social links from content
  const socialLinks = {
    github: content?.socialLinks?.find((l: any) => l.platform === "github")?.url,
    linkedin: content?.socialLinks?.find((l: any) => l.platform === "linkedin")?.url,
    twitter: content?.socialLinks?.find((l: any) => l.platform === "twitter")?.url,
  };

  // Get the latest analysis
  const latestAnalysis = data?.analyses?.[0];
  const trendReport = latestAnalysis?.trendReport;
  const strategistReport = latestAnalysis?.strategistReport;

  // Prepare sentiment chart data
  const sentimentChartData = (() => {
    if (!data?.sentimentHistory) return [];

    // Group by date
    const byDate: Record<string, Record<string, number>> = {};
    data.sentimentHistory.forEach((item) => {
      if (!byDate[item.date]) byDate[item.date] = {};
      byDate[item.date][item.category] = Math.round(item.avg_sentiment * 100);
    });

    // Convert to chart format
    return Object.entries(byDate)
      .map(([date, categories]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...categories,
      }))
      .reverse(); // Oldest first for chart
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-violet-500 rounded-full mb-4" />
          <p className="text-sm text-gray-500 dark:text-neutral-500">Loading Market Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Navigation name={content?.profile?.name || "Portfolio"} />

      <main className="pt-10 pb-8">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/news">
              <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer mb-2">
                <ArrowLeft className="size-3" />
                Back to News
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <Activity className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-neutral-200">
                  Market Intelligence Terminal
                </h1>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  AI-powered analysis of tech, finance, and geopolitics
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-10 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-700 dark:text-neutral-300">Failed to load market data.</p>
              <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                Make sure Supabase is configured and the database tables are created.
              </p>
            </div>
          )}

          {/* No Data State */}
          {!error && !latestAnalysis && (
            <div className="text-center py-10 border border-gray-200 rounded-xl dark:border-neutral-700">
              <BarChart3 className="size-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-neutral-400">No market intelligence data yet.</p>
              <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                Run a news sync to generate AI-powered market analysis.
              </p>
              <Link href="/news">
                <span className="inline-flex items-center gap-x-1 mt-4 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 cursor-pointer">
                  Go to News to Sync
                </span>
              </Link>
            </div>
          )}

          {/* Main Content */}
          {!error && latestAnalysis && (
            <div className="space-y-8">
              {/* Market Sentiment Overview */}
              <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="size-5 text-violet-500" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                    Market Sentiment
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-neutral-500 ml-auto">
                    {latestAnalysis.date ? new Date(latestAnalysis.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }) : "Latest"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Overall Sentiment */}
                  <div className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-800">
                    <SentimentGauge
                      value={strategistReport?.marketSentiment?.overall ?? 0}
                      label="Overall"
                    />
                  </div>

                  {/* Category Sentiments */}
                  {Object.entries(strategistReport?.marketSentiment?.byCategory || {}).slice(0, 5).map(([cat, value]) => (
                    <div key={cat} className="p-3 bg-gray-50 rounded-lg dark:bg-neutral-800">
                      <SentimentGauge
                        value={value}
                        label={data?.categoryNames?.[cat] || cat}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Daily Briefing */}
              <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="size-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                    Today's Briefing
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-neutral-400 leading-relaxed">
                  {latestAnalysis.briefing || "No briefing available."}
                </p>
              </section>

              {/* Sentiment Chart */}
              {sentimentChartData.length > 0 && (
                <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="size-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                      Sentiment Trends
                    </h2>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sentimentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[-100, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(17, 24, 39, 0.9)",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#e5e7eb" }}
                        />
                        <Legend />
                        {Object.keys(CATEGORY_COLORS).map((cat) => (
                          <Area
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            name={data?.categoryNames?.[cat] || cat}
                            stroke={CATEGORY_COLORS[cat]}
                            fill={CATEGORY_COLORS[cat]}
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {/* Trends & Opportunities - Stacked on narrow layout */}
              <div className="space-y-6">
                {/* Trends */}
                <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="size-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                      Market Trends
                    </h2>
                  </div>

                  {trendReport?.trends && trendReport.trends.length > 0 ? (
                    <div className="space-y-3">
                      {trendReport.trends.map((trend, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-100 rounded-lg p-4 dark:border-neutral-700 hover:border-gray-200 dark:hover:border-neutral-600 transition-colors"
                        >
                          <button
                            onClick={() => setExpandedTrend(expandedTrend === idx ? null : idx)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MomentumIcon momentum={trend.momentum} />
                                <span className="font-medium text-gray-800 dark:text-neutral-200">
                                  {trend.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full dark:bg-violet-900/30 dark:text-violet-400">
                                  {trend.confidence}% confidence
                                </span>
                                {expandedTrend === idx ? (
                                  <ChevronUp className="size-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="size-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </button>

                          {expandedTrend === idx && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                                {trend.analysis}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {trend.sectors.map((sector) => (
                                  <span
                                    key={sector}
                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded dark:bg-neutral-800 dark:text-neutral-400"
                                  >
                                    {data?.categoryNames?.[sector] || sector}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-neutral-500">
                      No trend data available.
                    </p>
                  )}

                  {/* Cross-category insights */}
                  {trendReport?.crossCategoryInsights && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg dark:from-violet-900/20 dark:to-purple-900/20">
                      <h3 className="text-sm font-medium text-violet-700 dark:text-violet-400 mb-2">
                        Cross-Category Insight
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {trendReport.crossCategoryInsights}
                      </p>
                    </div>
                  )}
                </section>

                {/* Opportunities */}
                <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="size-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                      Investment Opportunities
                    </h2>
                  </div>

                  {strategistReport?.opportunities && strategistReport.opportunities.length > 0 ? (
                    <div className="space-y-3">
                      {strategistReport.opportunities.map((opp, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-100 rounded-lg p-4 dark:border-neutral-700 hover:border-gray-200 dark:hover:border-neutral-600 transition-colors"
                        >
                          <button
                            onClick={() => setExpandedOpp(expandedOpp === idx ? null : idx)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                  style={{
                                    backgroundColor:
                                      opp.score >= 70
                                        ? "#10b981"
                                        : opp.score >= 50
                                        ? "#f59e0b"
                                        : "#6b7280",
                                  }}
                                >
                                  {opp.score}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800 dark:text-neutral-200">
                                    {data?.categoryNames?.[opp.category] || opp.category}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="size-3" />
                                    {opp.timeHorizon}-term
                                  </div>
                                </div>
                              </div>
                              {expandedOpp === idx ? (
                                <ChevronUp className="size-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="size-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {expandedOpp === idx && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700">
                              <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                                {opp.insight}
                              </p>
                              {opp.tickers && opp.tickers.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {opp.tickers.map((ticker) => (
                                    <span
                                      key={ticker}
                                      className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-mono dark:bg-green-900/30 dark:text-green-400"
                                    >
                                      ${ticker}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-neutral-500">
                      No opportunities identified.
                    </p>
                  )}
                </section>
              </div>

              {/* Risk Factors */}
              {strategistReport?.risks && strategistReport.risks.length > 0 && (
                <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="size-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                      Risk Factors
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {strategistReport.risks.map((risk, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-100 rounded-lg p-4 dark:border-neutral-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-gray-800 dark:text-neutral-200">
                            {risk.factor}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              SEVERITY_COLORS[risk.severity]
                            }`}
                          >
                            {risk.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">
                          {risk.mitigation}
                        </p>
                        {risk.affectedSectors && risk.affectedSectors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {risk.affectedSectors.map((sector) => (
                              <span
                                key={sector}
                                className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded dark:bg-red-900/20 dark:text-red-400"
                              >
                                {data?.categoryNames?.[sector] || sector}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Historical Briefings */}
              {data?.analyses && data.analyses.length > 1 && (
                <section className="border border-gray-200 rounded-xl p-6 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="size-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                      Historical Briefings
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {data.analyses.slice(1, 4).map((analysis) => (
                      <div
                        key={analysis.date}
                        className="border-l-2 border-gray-200 pl-4 dark:border-neutral-700"
                      >
                        <div className="text-sm font-medium text-gray-500 dark:text-neutral-500 mb-1">
                          {new Date(analysis.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2">
                          {analysis.briefing || "No briefing available."}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer name={content?.profile?.name} socialLinks={socialLinks} />
    </div>
  );
}
