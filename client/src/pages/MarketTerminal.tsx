import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
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
  ai_compute_infra: "#6366f1",
  fintech_regtech: "#22c55e",
  rpa_enterprise_ai: "#f97316",
  semi_supply_chain: "#06b6d4",
  cybersecurity: "#ef4444",
  geopolitics: "#ec4899",
};

export default function MarketTerminal() {
  const [data, setData] = useState<MarketTerminalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedTrend, setExpandedTrend] = useState<number | null>(0);
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

  const getTrendIcon = (momentum: string) => {
    if (momentum === "accelerating") return <TrendingUp className="w-3.5 h-3.5" />;
    if (momentum === "decelerating") return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const getScoreColor = (score: number) => {
    if (score > 50) return "text-emerald-600 dark:text-emerald-400";
    if (score > 0) return "text-emerald-500 dark:text-emerald-400";
    if (score < -50) return "text-red-600 dark:text-red-400";
    if (score < 0) return "text-red-500 dark:text-red-400";
    return "text-gray-500 dark:text-neutral-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 50) return "Bullish";
    if (score >= 20) return "Optimistic";
    if (score >= -20) return "Neutral";
    if (score >= -50) return "Cautious";
    return "Bearish";
  };

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        {/* Back Link */}
        <Link href="/news">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-neutral-200 mb-2">
            Market Intelligence
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            AI-powered analysis of tech, finance, and geopolitics
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-10 border border-red-200 rounded-xl bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-gray-700 dark:text-neutral-300">Failed to load market data.</p>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
              Make sure Supabase is configured and the database tables are created.
            </p>
          </div>
        )}

        {/* No Data State */}
        {!error && !latestAnalysis && (
          <div className="text-center py-10">
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
          <>
            {/* Market Sentiment - Simplified Layout */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200">Market Sentiment</h2>
                <span className="text-sm text-gray-500 dark:text-neutral-500">
                  {latestAnalysis.date ? new Date(latestAnalysis.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }) : "Latest"}
                </span>
              </div>

              {/* Overall Sentiment */}
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-200 dark:border-neutral-700">
                <span className={`text-4xl font-light tabular-nums ${getScoreColor(strategistReport?.marketSentiment?.overall ?? 0)}`}>
                  {(strategistReport?.marketSentiment?.overall ?? 0) > 0 ? "+" : ""}{strategistReport?.marketSentiment?.overall ?? 0}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-neutral-200">
                    {getScoreLabel(strategistReport?.marketSentiment?.overall ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-500">Overall market sentiment</p>
                </div>
              </div>

              {/* Category Breakdown - Simple List */}
              <div className="space-y-3">
                {Object.entries(strategistReport?.marketSentiment?.byCategory || {}).map(([cat, value]) => (
                  <div key={cat} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-neutral-500">
                      {data?.categoryNames?.[cat] || cat}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-neutral-500">{getScoreLabel(value)}</span>
                      <span className={`text-sm font-medium tabular-nums ${getScoreColor(value)}`}>
                        {value > 0 ? "+" : ""}{value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Today's Briefing */}
            <section className="mb-12">
              <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-4">Today's Briefing</h2>
              <p className="text-gray-600 dark:text-neutral-400 leading-relaxed">
                {latestAnalysis.briefing || "No briefing available."}
              </p>
            </section>

            {/* Sentiment Trends Chart */}
            {sentimentChartData.length > 0 && (
              <section className="mb-12">
                <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-6">Sentiment Trends</h2>

                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.9)",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                          fontSize: "12px"
                        }}
                      />
                      {Object.keys(CATEGORY_COLORS).map((cat) => (
                        <Line
                          key={cat}
                          type="monotone"
                          dataKey={cat}
                          name={data?.categoryNames?.[cat] || cat}
                          stroke={CATEGORY_COLORS[cat]}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-500 dark:text-neutral-500">
                        {data?.categoryNames?.[cat] || cat}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Market Trends */}
            <section className="mb-12">
              <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-6">Market Trends</h2>

              {trendReport?.trends && trendReport.trends.length > 0 ? (
                <div className="space-y-3">
                  {trendReport.trends.map((trend, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-neutral-700 pb-4">
                      <button
                        onClick={() => setExpandedTrend(expandedTrend === index ? null : index)}
                        className="flex items-center justify-between w-full text-left py-2"
                      >
                        <div className="flex items-center gap-2">
                          {getTrendIcon(trend.momentum)}
                          <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">{trend.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-neutral-500">{trend.confidence}% confidence</span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 dark:text-neutral-500 transition-transform ${expandedTrend === index ? "rotate-180" : ""
                              }`}
                          />
                        </div>
                      </button>
                      {expandedTrend === index && (
                        <div className="pt-2">
                          <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-2">
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
                <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Cross-Category Insight
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                    {trendReport.crossCategoryInsights}
                  </p>
                </div>
              )}
            </section>

            {/* Investment Opportunities */}
            <section className="mb-12">
              <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-4">Investment Opportunities</h2>
              {strategistReport?.opportunities && strategistReport.opportunities.length > 0 ? (
                <div className="space-y-4">
                  {strategistReport.opportunities.map((opp, idx) => (
                    <div key={idx} className="py-4 border-b border-gray-200 dark:border-neutral-700 last:border-b-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">
                            {data?.categoryNames?.[opp.category] || opp.category}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-neutral-500 ml-2">
                            {opp.timeHorizon}-term
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${opp.score >= 70 ? "text-emerald-600 dark:text-emerald-400" : opp.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-neutral-400"}`}>
                          Score: {opp.score}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-2">{opp.insight}</p>
                      {opp.tickers && opp.tickers.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opp.tickers.map((ticker) => (
                            <span
                              key={ticker}
                              className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono dark:bg-emerald-900/30 dark:text-emerald-400"
                            >
                              ${ticker}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-neutral-500">No opportunities identified.</p>
              )}
            </section>

            {/* Historical Briefings */}
            {data?.analyses && data.analyses.length > 1 && (
              <section className="mb-12">
                <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-6">Historical Briefings</h2>

                <div className="space-y-0">
                  {data.analyses.slice(1, 4).map((analysis, index) => (
                    <article
                      key={analysis.date}
                      className={`py-4 ${index !== Math.min(data.analyses.length - 2, 2) ? "border-b border-gray-200 dark:border-neutral-700" : ""}`}
                    >
                      <p className="text-sm text-gray-500 dark:text-neutral-500 mb-1.5">
                        {new Date(analysis.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-neutral-200 leading-relaxed line-clamp-2">
                        {analysis.briefing || "No briefing available."}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer name={content?.profile?.name} socialLinks={socialLinks} />
    </div>
  );
}
