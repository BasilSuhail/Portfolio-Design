import {
    RawArticle,
    EnrichedArticle,
    SentimentScore
} from '../core/types';
import { sentimentEngine } from './sentiment';
import { ImpactEngine } from './impact';
import { GeoTagEngine } from './geotags';
import { storage } from '../core/storage';

/**
 * Enrichment Pipeline - Orchestrates the "Local Brain"
 * Processes raw articles and adds intelligent metadata.
 */
export class EnrichmentPipeline {
    /**
     * Enrich a batch of articles
     */
    public async enrichBatch(articles: RawArticle[]): Promise<EnrichedArticle[]> {
        console.log(`[Enrichment] Processing ${articles.length} articles...`);

        const enriched: EnrichedArticle[] = [];

        for (const article of articles) {
            try {
                const enrichedArticle = this.enrichSingle(article);
                enriched.push(enrichedArticle);
            } catch (error) {
                console.error(`[Enrichment] Failed for article ${article.id}:`, error);
            }
        }

        // Save enriched articles to storage
        if (enriched.length > 0) {
            console.log(`[Enrichment] Saving ${enriched.length} enriched articles...`);
            storage.saveEnrichedArticles(enriched);
        }

        return enriched;
    }

    /**
     * Perform all enrichment steps on a single article
     */
    private enrichSingle(article: RawArticle): EnrichedArticle {
        // 1. Sentiment Analysis
        const textToAnalyze = `${article.title} ${article.description || ''}`;
        const sentiment = sentimentEngine.analyze(textToAnalyze);

        // 2. Geopolitical Tagging
        const geoResult = GeoTagEngine.tag(textToAnalyze);

        // 3. Impact Scoring
        const impactScore = ImpactEngine.calculate({
            sentimentMagnitude: Math.abs(sentiment.normalizedScore),
            clusterSize: 1, // Default for non-clustered, will be updated after clustering
            sourceWeight: 1.0, // Should be looked up by source name
            recency: ImpactEngine.calculateRecency(article.publishedAt)
        }, article.sourceId);

        // 4. Topic Extraction (Simple keyword-based for now)
        const topics = this.extractSimpleTopics(textToAnalyze);

        return {
            ...article,
            sentiment,
            impactScore,
            geoTags: geoResult.tags,
            topics,
            clusterId: undefined
        };
    }

    private extractSimpleTopics(text: string): string[] {
        // Very simple topic extractor - will be replaced by Clustering Layer
        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that'];
        return text.split(/\s+/)
            .filter(w => w.length > 4 && !commonWords.includes(w.toLowerCase()))
            .slice(0, 5);
    }
}

export const enrichmentPipeline = new EnrichmentPipeline();
