/**
 * Analysis Response Cache
 * In-memory cache for AI analysis responses with TTL
 */

import { logDebug, logInfo } from '@/lib/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttlMs: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Keep last 100 analyses
};

/**
 * Simple in-memory cache with TTL and size limits
 */
export class AnalysisCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(text: string, model: string, context?: any): string {
    // Create deterministic key from inputs
    const contextKey = context ? JSON.stringify(context) : '';
    return `${model}:${text}:${contextKey}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logDebug(`Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Enforce max size limit (LRU eviction)
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.config.maxSize) {
      return;
    }

    // Remove oldest entries first
    const entriesToRemove = this.cache.size - this.config.maxSize;
    const sortedEntries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    for (let i = 0; i < entriesToRemove; i++) {
      this.cache.delete(sortedEntries[i][0]);
    }

    logDebug(`Evicted ${entriesToRemove} old cache entries (max size: ${this.config.maxSize})`);
  }

  /**
   * Get cached value if it exists and is not expired
   */
  get(text: string, model: string, context?: any): T | null {
    const key = this.generateKey(text, model, context);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      logDebug('Cache entry expired', { key });
      return null;
    }

    logInfo('Cache hit', { key, age: Date.now() - entry.timestamp });
    return entry.data;
  }

  /**
   * Store value in cache with TTL
   */
  set(text: string, model: string, data: T, context?: any): void {
    const key = this.generateKey(text, model, context);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + this.config.ttlMs,
    };

    this.cache.set(key, entry);
    logInfo('Cache set', { key, ttl: this.config.ttlMs });

    // Periodic cleanup
    if (this.cache.size % 10 === 0) {
      this.cleanup();
    }

    // Enforce size limits
    this.enforceMaxSize();
  }

  /**
   * Check if key exists and is not expired
   */
  has(text: string, model: string, context?: any): boolean {
    return this.get(text, model, context) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logInfo(`Cleared cache (${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.timestamp);

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttlMs: this.config.ttlMs,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}

// Singleton instance for API route
let cacheInstance: AnalysisCache | null = null;

/**
 * Get or create cache instance
 */
export function getAnalysisCache(): AnalysisCache {
  if (!cacheInstance) {
    cacheInstance = new AnalysisCache({
      ttlMs: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
    });
  }
  return cacheInstance;
}

/**
 * Clear the global cache instance
 */
export function clearAnalysisCache(): void {
  if (cacheInstance) {
    cacheInstance.clear();
  }
}

export default AnalysisCache;