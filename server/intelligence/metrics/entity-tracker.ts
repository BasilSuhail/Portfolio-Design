/**
 * Entity Sentiment Tracker
 *
 * Aggregates sentiment per named entity per day using the NER data
 * already extracted by the enrichment pipeline.
 *
 * This enables Bloomberg Terminal-style entity sentiment timelines.
 */

import { EnrichedArticle, EntitySentimentPoint } from '../core/types';
import { storage } from '../core/storage';

class EntityTracker {

  /**
   * Track entity sentiment from enriched articles for a specific date
   */
  public trackEntities(articles: EnrichedArticle[], date: string): void {
    console.log(`[EntityTracker] Processing ${articles.length} articles for entity tracking...`);

    // Group sentiment by entity
    const entityMap = new Map<string, {
      entityType: string;
      sentiments: number[];
    }>();

    for (const article of articles) {
      if (!article.entities) continue;

      const sentiment = article.sentiment?.normalizedScore || 0;

      // Track people
      for (const person of article.entities.people) {
        const normalized = this.normalizeEntity(person);
        if (!normalized) continue;
        this.addToMap(entityMap, normalized, 'person', sentiment);
      }

      // Track organizations
      for (const org of article.entities.organizations) {
        const normalized = this.normalizeEntity(org);
        if (!normalized) continue;
        this.addToMap(entityMap, normalized, 'organization', sentiment);
      }

      // Track places
      for (const place of article.entities.places) {
        const normalized = this.normalizeEntity(place);
        if (!normalized) continue;
        this.addToMap(entityMap, normalized, 'place', sentiment);
      }

      // Track topics
      for (const topic of article.entities.topics) {
        const normalized = this.normalizeEntity(topic);
        if (!normalized) continue;
        this.addToMap(entityMap, normalized, 'topic', sentiment);
      }
    }

    // Calculate averages and save
    const points: EntitySentimentPoint[] = [];

    const entityEntries = Array.from(entityMap.entries());
    for (let i = 0; i < entityEntries.length; i++) {
      const entity = entityEntries[i][0];
      const data = entityEntries[i][1];
      // Skip entities with only 1 mention (noise)
      if (data.sentiments.length < 1) continue;

      const avgSentiment = data.sentiments.reduce((s: number, v: number) => s + v, 0) / data.sentiments.length;

      points.push({
        entity,
        entityType: data.entityType as EntitySentimentPoint['entityType'],
        date,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        articleCount: data.sentiments.length
      });
    }

    if (points.length > 0) {
      storage.saveEntitySentiment(points);
      console.log(`[EntityTracker] Tracked ${points.length} entities for ${date}`);
    } else {
      console.log(`[EntityTracker] No entities found to track`);
    }
  }

  /**
   * Add a sentiment observation to the entity map
   */
  private addToMap(
    map: Map<string, { entityType: string; sentiments: number[] }>,
    entity: string,
    entityType: string,
    sentiment: number
  ): void {
    const existing = map.get(entity);
    if (existing) {
      existing.sentiments.push(sentiment);
    } else {
      map.set(entity, { entityType, sentiments: [sentiment] });
    }
  }

  /**
   * Normalize entity names for consistent tracking
   * Filters out too-short or generic names
   */
  private normalizeEntity(name: string): string | null {
    const trimmed = name.trim();

    // Skip very short names (likely noise)
    if (trimmed.length < 2) return null;

    // Skip common generic terms
    const skipList = new Set([
      'the', 'a', 'an', 'it', 'they', 'we', 'us', 'our',
      'today', 'yesterday', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ]);

    if (skipList.has(trimmed.toLowerCase())) return null;

    // Title case for consistency
    return trimmed.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

export const entityTracker = new EntityTracker();
