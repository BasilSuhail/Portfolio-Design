import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Helmet } from "react-helmet-async";

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

export default function NewsDetail() {
  const [, params] = useRoute("/news/:date");
  const [newsDay, setNewsDay] = useState<NewsDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!params?.date) return;

      try {
        const res = await fetch(`/api/news/${params.date}`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        setNewsDay(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [params?.date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground animate-pulse">Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!newsDay) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">News Not Found</h2>
            <p className="text-muted-foreground">
              This news briefing does not exist or has been removed.
            </p>
            <Link href="/">
              <a className="text-primary inline-flex items-center hover:underline mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { key: "ai_compute_infra", title: "AI Compute & Infra" },
    { key: "fintech_regtech", title: "FinTech & RegTech" },
    { key: "rpa_enterprise_ai", title: "RPA & Enterprise AI" },
    { key: "semi_supply_chain", title: "Semiconductor Supply Chain" },
    { key: "cybersecurity", title: "Cybersecurity" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tech Briefing: {newsDay.date} | Your Portfolio</title>
        <meta
          name="description"
          content={newsDay.content.briefing.substring(0, 160)}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`Tech Briefing: ${newsDay.date}`} />
        <meta
          property="og:description"
          content={newsDay.content.briefing.substring(0, 160)}
        />
      </Helmet>

      <div className="border-b bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/">
            <a className="text-sm text-muted-foreground hover:text-primary inline-flex items-center transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </a>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Tech Briefing:{" "}
            <time dateTime={newsDay.date} className="text-primary">
              {new Date(newsDay.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </h1>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(
              (cat) =>
                newsDay.content[cat.key as keyof typeof newsDay.content] &&
                (
                  newsDay.content[cat.key as keyof typeof newsDay.content] as NewsItem[]
                ).length > 0 && (
                  <Badge key={cat.key} variant="secondary">
                    {cat.title}
                  </Badge>
                )
            )}
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            AI Summary
          </h2>
          <div className="text-lg leading-relaxed text-foreground bg-muted/30 p-6 rounded-xl border border-border">
            {newsDay.content.briefing}
          </div>
        </section>

        <div className="space-y-12">
          {categories.map((cat) => {
            const items = newsDay.content[
              cat.key as keyof typeof newsDay.content
            ] as NewsItem[] | undefined;
            return (
              items &&
              items.length > 0 && (
                <section key={cat.key} className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
                    {cat.title}
                  </h2>
                  <div className="grid gap-4">
                    {items.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <Card className="p-4 transition-all hover:shadow-md hover:border-primary/50 bg-card">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                              {item.headline}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs h-5 px-1.5 rounded-sm"
                            >
                              {item.ticker}
                            </Badge>
                            <span>{item.source}</span>
                          </div>
                        </Card>
                      </a>
                    ))}
                  </div>
                </section>
              )
            );
          })}
        </div>
      </article>
    </div>
  );
}
