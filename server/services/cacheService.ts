import NodeCache from 'node-cache';
import crypto from 'crypto';
import { logger } from '../utils/logger';

class CacheService {
  private cache: NodeCache;
  private aiCache: NodeCache;
  private tokenUsageCache: NodeCache;

  constructor() {
    // General cache - 1 hour TTL
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false
    });

    // AI response cache - 24 hours TTL
    this.aiCache = new NodeCache({
      stdTTL: 86400, // 24 hours
      checkperiod: 3600, // Check every hour
      useClones: false
    });

    // Token usage tracking - resets daily
    this.tokenUsageCache = new NodeCache({
      stdTTL: 86400, // 24 hours
      checkperiod: 3600, // Check every hour
      useClones: false
    });

    logger.info('Cache service initialized');
  }

  // Generate hash for cache key
  private generateHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  // AI Response Caching
  async getAIResponse(journalText: string): Promise<any | null> {
    const hash = this.generateHash(journalText.toLowerCase().trim());
    const cached = this.aiCache.get(`ai_${hash}`);
    
    if (cached) {
      logger.info('AI response cache hit', { hash: hash.substring(0, 8) });
      return cached;
    }
    
    return null;
  }

  async setAIResponse(journalText: string, response: any): Promise<void> {
    const hash = this.generateHash(journalText.toLowerCase().trim());
    this.aiCache.set(`ai_${hash}`, response);
    logger.info('AI response cached', { hash: hash.substring(0, 8) });
  }

  // Token Usage Tracking
  async trackTokenUsage(userId: string, tokens: number): Promise<number> {
    const key = `tokens_${userId}`;
    const currentUsage = this.tokenUsageCache.get<number>(key) || 0;
    const newUsage = currentUsage + tokens;
    
    this.tokenUsageCache.set(key, newUsage);
    
    logger.info('Token usage tracked', { userId, tokens, totalUsage: newUsage });
    return newUsage;
  }

  async getUserTokenUsage(userId: string): Promise<number> {
    return this.tokenUsageCache.get<number>(`tokens_${userId}`) || 0;
  }

  async checkTokenLimit(userId: string, limit: number = 50000): Promise<boolean> {
    const usage = await this.getUserTokenUsage(userId);
    return usage < limit;
  }

  // General caching
  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return value;
    }
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value, ttl);
    logger.debug('Cache set', { key, ttl });
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
    logger.debug('Cache deleted', { key });
  }

  // User-specific caching
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(`user_${userId}_${key}`);
  }

  async setUserCache<T>(userId: string, key: string, value: T, ttl?: number): Promise<void> {
    return this.set(`user_${userId}_${key}`, value, ttl);
  }

  // Emotion analysis caching
  async getEmotionAnalysis(text: string): Promise<any | null> {
    const hash = this.generateHash(text);
    return this.get(`emotion_${hash}`);
  }

  async setEmotionAnalysis(text: string, analysis: any): Promise<void> {
    const hash = this.generateHash(text);
    await this.set(`emotion_${hash}`, analysis, 7200); // 2 hours
  }

  // Cache statistics
  getStats() {
    return {
      general: this.cache.getStats(),
      ai: this.aiCache.getStats(),
      tokenUsage: this.tokenUsageCache.getStats()
    };
  }

  // Clear all caches
  flushAll(): void {
    this.cache.flushAll();
    this.aiCache.flushAll();
    this.tokenUsageCache.flushAll();
    logger.info('All caches flushed');
  }
}

export const cacheService = new CacheService();