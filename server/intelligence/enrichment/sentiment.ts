import Sentiment from 'sentiment';
import { SentimentScore } from '../core/types';
import { sentimentCache } from '../core/cache';

/**
 * Market Intelligence - Sentiment Analysis Engine
 * 
 * Implements a hybrid approach:
 * 1. Local Rule-Based (Sentiment npm + Financial Dictionary)
 * 2. Caching Layer (Prevents re-analyzing same text)
 */
export class SentimentEngine {
    private analyzer: Sentiment;
    private customTerms: Record<string, number> = {
        // Bullish / Positive
        "bullish": 4, "surge": 4, "soar": 4, "rally": 3, "rallying": 3,
        "breakthrough": 4, "innovation": 3, "outperform": 4, "beat": 3,
        "record-breaking": 3, "milestone": 3, "acquisition": 2, "profit": 3,
        "revenue beat": 4, "expansion": 2, "optimism": 3, "growth": 3,
        "partnership": 2, "upgrade": 3, "dividend": 2, "buyback": 3,

        // Bearish / Negative
        "bearish": -4, "crash": -5, "plunge": -4, "tumble": -4, "decline": -2,
        "layoff": -4, "layoffs": -4, "cut": -2, "cuts": -2, "slash": -3,
        "warning": -3, "risk": -2, "threat": -3, "crisis": -4, "bankruptcy": -5,
        "volatile": -2, "uncertainty": -3, "downturn": -4, "recession": -4,
        "sanctions": -3, "breach": -4, "hack": -4, "vulnerability": -3,
        "exploit": -3, "lawsuit": -3, "litigation": -2, "fine": -2,
        "shortage": -3, "inflation": -2, "stagflation": -4,

        // Tech specific
        "AI-driven": 2, "generative AI": 2, "LLM": 1, "GPU": 1,
        "chip shortage": -3, "semiconductor": 1, "foundry": 1
    };

    constructor() {
        this.analyzer = new Sentiment();
        this.analyzer.registerLanguage('en-market', {
            labels: this.customTerms
        });
    }

    /**
     * Analyze high-level sentiment of a headline and description
     */
    public analyze(text: string): SentimentScore {
        // 1. Check Cache
        const cached = sentimentCache.getSentiment(text);
        if (cached !== null) {
            return this.formatResult(cached, 'local'); // Simplified for now
        }

        // 2. Perform Local Analysis
        const result = this.analyzer.analyze(text, { language: 'en-market' });

        // Normalize score to -100 to 100 range
        // Sentiment npm comparative score is typically between -5 and 5
        // We multiply by 20 to get into -100 to 100 range
        const normalizedScore = Math.max(-100, Math.min(100, Math.round(result.comparative * 20)));
        const score = normalizedScore / 100; // -1 to 1 scale

        let label: 'positive' | 'negative' | 'neutral';
        if (normalizedScore > 10) label = 'positive';
        else if (normalizedScore < -10) label = 'negative';
        else label = 'neutral';

        // Confidence based on word count and intensity
        const wordCount = text.split(/\s+/).length;
        const scoreMagnitude = Math.abs(result.score);
        const confidence = Math.min(0.95, (scoreMagnitude * 0.1) + (wordCount * 0.02));

        const finalResult: SentimentScore = {
            score,
            normalizedScore,
            confidence,
            label,
            method: 'local'
        };

        // 3. Cache Result
        sentimentCache.setSentiment(text, normalizedScore);

        return finalResult;
    }

    private formatResult(normalizedScore: number, method: 'local' | 'finbert'): SentimentScore {
        let label: 'positive' | 'negative' | 'neutral';
        if (normalizedScore > 10) label = 'positive';
        else if (normalizedScore < -10) label = 'negative';
        else label = 'neutral';

        return {
            score: normalizedScore / 100,
            normalizedScore,
            confidence: 0.9, // Higher confidence for cached/re-calculated
            label,
            method
        };
    }
}

export const sentimentEngine = new SentimentEngine();
