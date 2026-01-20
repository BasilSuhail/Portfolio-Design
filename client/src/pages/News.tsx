import { useState, useEffect } from "react";
import { Link } from "wouter";
import { CalendarDays, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useContent } from "@/hooks/use-content";
import { LiquidGlassButton } from "@/components/ui/liquid-glass";

interface NewsItem {
  ticker: string;
  headline: string;
  url: string;
  source: string;
}

interface NewsDay {
  date: string;
  content: {
    briefing: string;
    ai_compute_infra?: NewsItem[];
    fintech_regtech?: NewsItem[];
    rpa_enterprise_ai?: NewsItem[];
    semi_supply_chain?: NewsItem[];
    cybersecurity?: NewsItem[];
  };
}

export default function News() {
  const [news, setNews] = useState<NewsDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { data: content } = useContent();

  const loadNews = async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.news || []);
      setError(false);
    } catch (e) {
      console.error("News fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNews();
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Extract social links from content
  const socialLinks = {
    github: content?.socialLinks?.find((l: any) => l.platform === 'github')?.url,
    linkedin: content?.socialLinks?.find((l: any) => l.platform === 'linkedin')?.url,
    twitter: content?.socialLinks?.find((l: any) => l.platform === 'twitter')?.url,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-gray-400 rounded-full dark:text-neutral-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/">
                <span className="inline-flex items-center gap-x-1 text-xs text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 cursor-pointer mb-2">
                  <ArrowLeft className="size-3" />
                  Back to Home
                </span>
              </Link>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-neutral-200">
                Tech News
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                Daily briefings on AI, fintech, semiconductors, and cybersecurity
              </p>
            </div>
            <LiquidGlassButton
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing..." : "Sync"}
            </LiquidGlassButton>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-neutral-500">Failed to load news. Please try again.</p>
            </div>
          )}

          {/* News Grid - Tiles */}
          {!error && news.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {news.map((day) => (
                <Link key={day.date} href={`/news/${day.date}`}>
                  <div className="group p-5 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer dark:border-neutral-700 dark:hover:border-neutral-600">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-5 text-gray-400 group-hover:text-gray-600 dark:text-neutral-500 dark:group-hover:text-neutral-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-neutral-500">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-4 mb-4">
                      {day.content.briefing}
                    </p>

                    <span className="inline-flex items-center gap-x-1 text-xs font-medium text-gray-500 group-hover:text-gray-800 dark:text-neutral-500 dark:group-hover:text-neutral-200">
                      Read full briefing
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!error && news.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-neutral-500">No news available yet.</p>
            </div>
          )}
        </div>
      </main>

      <Footer
        name={content?.profile?.name}
        socialLinks={socialLinks}
      />
    </div>
  );
}
