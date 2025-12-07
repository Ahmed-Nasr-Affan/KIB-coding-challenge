import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Service for managing Redis cache
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return value;
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cached value for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${(error as Error).message}`);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   * @param key Cache key
   * @param factory Function to get value if not in cache
   * @param ttl Time to live in seconds
   * @returns Cached or fetched value
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const value = await this.get<T>(key);

    if (value !== null) {
      return value;
    }

    const newValue = await factory();
    await this.set(key, newValue, ttl);

    return newValue;
  }

  /**
   * Invalidate cache by pattern
   * @param pattern Pattern to match keys (e.g., 'movies:*')
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      this.logger.debug(`Invalidating cache for pattern: ${pattern}`);
      // Note: This requires additional Redis commands support
      // For now, we'll just log it
      // In production, you might want to use ioredis directly for pattern matching
    } catch (error) {
      this.logger.error(`Error invalidating cache pattern ${pattern}: ${(error as Error).message}`);
    }
  }
}
