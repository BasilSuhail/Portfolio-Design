import {
    EnrichedArticle,
    ArticleCluster,
    ClusteringResult
} from '../core/types';
import { clusteringEngine } from './tfidf';
import { storage } from '../core/storage';
import { clusterCache } from '../core/cache';

/**
 * Clustering Pipeline - Orchestrates the Clustering Layer
 * Group articles into topics and updates storage with results.
 */
export class ClusteringPipeline {
    /**
     * Run the clustering process on a batch of enriched articles
     */
    public async clusterBatch(articles: EnrichedArticle[]): Promise<ArticleCluster[]> {
        if (articles.length === 0) return [];

        // 1. Check Cache
        const articleIds = articles.map(a => a.id).sort();
        const cached = clusterCache.get(this.generateCacheKey(articleIds));
        if (cached) {
            console.log(`[Clustering] Cache HIT - skipping clustering.`);
            return cached;
        }

        // 2. Run Clustering
        console.log(`[Clustering] Running engine on ${articles.length} articles...`);
        const clusters = await clusteringEngine.cluster(articles);

        // 3. Update Enriched Articles with Cluster IDs
        const updatedArticles: EnrichedArticle[] = [];
        for (const cluster of clusters) {
            for (const article of cluster.articles) {
                article.clusterId = cluster.id;
                updatedArticles.push(article);
            }
        }

        // 4. Save to Storage
        if (clusters.length > 0) {
            console.log(`[Clustering] Saving ${clusters.length} clusters...`);
            storage.saveClusters(clusters);

            if (updatedArticles.length > 0) {
                storage.saveEnrichedArticles(updatedArticles);
            }

            // Cache results
            clusterCache.set(this.generateCacheKey(articleIds), clusters);
        }

        return clusters;
    }

    private generateCacheKey(articleIds: string[]): string {
        const crypto = require('crypto');
        const serialized = JSON.stringify(articleIds);
        return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
    }
}

export const clusteringPipeline = new ClusteringPipeline();
