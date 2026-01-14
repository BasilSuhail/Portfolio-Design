import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
      // Just reload news data from the server (fast)
      await loadNews();
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const checkScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const cardWidth = 320;
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
      return () => {
        slider.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [news]);

  // Hide if loading, error, not visible, or no news
  if (loading || error || !isVisible || news.length === 0) {
    return null;
  }

  // Show up to 7 days of news
  const displayedNews = news.slice(0, 7);

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

        {/* Slider container with space for arrows */}
        <div className="flex items-center gap-2">
          {/* Left scroll button */}
          <Button
            variant="outline"
            size="icon"
            className={`flex-shrink-0 bg-background shadow-sm hidden sm:flex ${!canScrollLeft ? "invisible" : ""}`}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Scrollable news cards */}
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 flex-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {displayedNews.map((day) => (
              <Link key={day.date} href={`/news/${day.date}`}>
                <a
                  className="block group flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <Card className="w-[240px] sm:w-[260px] h-full transition-all hover:border-primary/50 hover:shadow-md bg-card">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Badge variant="outline" className="text-xs">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm mt-1">
                        {day.content.briefing}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </a>
              </Link>
            ))}
          </div>

          {/* Right scroll button */}
          <Button
            variant="outline"
            size="icon"
            className={`flex-shrink-0 bg-background shadow-sm hidden sm:flex ${!canScrollRight ? "invisible" : ""}`}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Scroll indicators for mobile */}
        <div className="flex justify-center gap-1 mt-4 sm:hidden">
          {displayedNews.map((day) => (
            <div
              key={day.date}
              className="w-2 h-2 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
