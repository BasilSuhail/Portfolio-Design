import { BaseProvider } from './base.provider';
import {
    RawArticle,
    FetchOptions,
    ArticleCategory,
    DataProvider
} from '../../core/types';

/**
 * NewsAPI Provider - Fetches articles from newsapi.org
 * Implements multi-key rotation and rate limit tracking.
 */
export class NewsAPIProvider extends BaseProvider {
    public name: DataProvider = 'newsapi';

    private apiKeys: string[] = [];
    private currentKeyIndex: number = 0;
    private rateLimitedKeys: Set<string> = new Set();

    constructor() {
        super();
        this.loadApiKeys();
    }

    private loadApiKeys() {
        if (process.env.NEWS_API_KEY) this.apiKeys.push(process.env.NEWS_API_KEY);
        if (process.env.NEWS_API_KEY_2) this.apiKeys.push(process.env.NEWS_API_KEY_2);
        if (process.env.NEWS_API_KEY_3) this.apiKeys.push(process.env.NEWS_API_KEY_3);

        this.apiKeys = this.apiKeys.filter(k => k && !k.includes('YOUR_'));
        this.remainingCalls = this.apiKeys.length * 100; // Rough estimate for free tier
    }

    private getNextApiKey(): string | null {
        if (this.apiKeys.length === 0) return null;

        for (let i = 0; i < this.apiKeys.length; i++) {
            const index = (this.currentKeyIndex + i) % this.apiKeys.length;
            const key = this.apiKeys[index];

            if (!this.rateLimitedKeys.has(key)) {
                this.currentKeyIndex = (index + 1) % this.apiKeys.length;
                return key;
            }
        }

        return null;
    }

    private markRateLimited(key: string) {
        this.rateLimitedKeys.add(key);
        console.warn(`[NewsAPI] Key ${this.apiKeys.indexOf(key) + 1} hit rate limit`);
    }

    public async isAvailable(): Promise<boolean> {
        return this.apiKeys.length > 0 && this.getNextApiKey() !== null;
    }

    public async fetchArticles(options: FetchOptions): Promise<RawArticle[]> {
        const categories = options.categories || [
            'ai_compute_infra', 'fintech_regtech', 'rpa_enterprise_ai',
            'semiconductor', 'cybersecurity', 'geopolitics'
        ];

        // Default to last 24h if no dates provided
        const fromDate = options.dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const toDate = options.dateTo || new Date().toISOString().split('T')[0];

        const allArticles: RawArticle[] = [];

        for (const category of categories) {
            const query = this.getQueryForCategory(category);
            const apiKey = this.getNextApiKey();

            if (!apiKey) {
                console.warn(`[NewsAPI] No available keys for category: ${category}`);
                break;
            }

            try {
                const encodedQuery = encodeURIComponent(query);
                const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&from=${fromDate}&to=${toDate}&pageSize=${options.maxArticles || 10}&apiKey=${apiKey}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.status !== 'ok') {
                    if (data.message?.includes('rate limit') || data.message?.includes('too many requests')) {
                        this.markRateLimited(apiKey);
                        continue;
                    }
                    console.error(`[NewsAPI] Error: ${data.message}`);
                    continue;
                }

                // Filter out articles with invalid/missing titles
                // NewsAPI returns "[Removed]" for unavailable articles, and sometimes returns
                // articles where the title is just the source/domain name
                const validArticles = (data.articles || []).filter((article: any) => {
                    const title = article.title?.trim();
                    const sourceName = article.source?.name?.toLowerCase();

                    if (!title || title.length < 10 || !article.url) return false;
                    if (title.includes('[Removed]')) return false;

                    // Check if title is just the source name
                    const titleLower = title.toLowerCase();
                    if (sourceName && (titleLower === sourceName || titleLower.startsWith(sourceName))) return false;

                    // Check if title looks like a domain (e.g., "JoBlo.com", "Pypi.org")
                    if (/^[a-zA-Z0-9-]+\.(com|org|net|io|co|uk|de|fr|news|tech)$/i.test(title)) return false;

                    return true;
                });

                const newsapiArticles = validArticles.map((article: any) => ({
                    id: this.generateId(article.url),
                    title: article.title,
                    description: article.description,
                    content: article.content,
                    url: article.url,
                    source: article.source.name,
                    sourceId: article.source.id || article.source.name.toLowerCase().replace(/\s+/g, '-'),
                    publishedAt: article.publishedAt,
                    category,
                    ticker: this.getTickerForCategory(category),
                    provider: this.name,
                    imageUrl: article.urlToImage
                }));

                allArticles.push(...newsapiArticles);

                // Respect free tier (small delay)
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                console.error(`[NewsAPI] Fetch failed for ${category}:`, error);
            }
        }

        return allArticles;
    }

    private getTickerForCategory(category: ArticleCategory): string {
        const map: Record<ArticleCategory, string> = {
            ai_compute_infra: "NVDA",
            fintech_regtech: "PYPL",
            rpa_enterprise_ai: "PATH",
            semiconductor: "TSM",
            cybersecurity: "CRWD",
            geopolitics: "GEO"
        };
        return map[category] || "MARKET";
    }

    private getQueryForCategory(category: ArticleCategory): string {
        const map: Record<ArticleCategory, string> = {
            ai_compute_infra: "NVIDIA OR AMD OR Google AI OR Microsoft AI OR Meta AI",
            fintech_regtech: "PayPal OR Visa payments OR Mastercard OR fintech",
            rpa_enterprise_ai: "ServiceNow OR Salesforce OR UiPath OR enterprise AI",
            semiconductor: "TSMC OR ASML OR semiconductor shortage OR chip manufacturing",
            cybersecurity: "CrowdStrike OR Palo Alto Networks OR cybersecurity breach",
            geopolitics: "US China tech OR Taiwan semiconductor OR tech sanctions"
        };
        return map[category] || category;
    }
}
