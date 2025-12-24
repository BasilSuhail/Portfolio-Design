import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, RefreshCw } from "lucide-react";
import { secureFetch } from "@/lib/csrf";

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

export function NewsSection() {
  const [news, setNews] = useState<NewsDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState(false);

  const loadNews = async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setNews(data.news || []);
      setIsVisible(data.visible !== false);
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
      const res = await secureFetch("/api/news/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadNews();
      }
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Hide if loading, error, not visible, or no news
  if (loading || error || !isVisible || news.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
              TECH NEWS
            </span>
            <p className="text-foreground/80">
              Follow the news while you're here
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {refreshing ? "Syncing..." : "Sync"}
            </span>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.slice(0, 3).map((day) => (
            <Link key={day.date} href={`/news/${day.date}`}>
              <a className="block group h-full">
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md bg-card">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-3">
                      <CalendarDays className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Badge variant="outline" className="text-xs">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-sm mt-2">
                      {day.content.briefing}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        {news.length > 3 && (
          <div className="mt-8 text-center">
            <Link href="/news">
              <a className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                View All News Briefings
                <span className="text-xs">({news.length} total)</span>
              </a>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
