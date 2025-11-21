import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  staleWhileRevalidate?: boolean; // Return stale data while fetching new (default: true)
}

const defaultOptions: Required<CacheOptions> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
};

/**
 * In-memory cache for API responses
 */
const cache = new Map<string, CacheEntry<any>>();

/**
 * Custom hook for caching API calls with automatic revalidation
 */
export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRevalidating(true);
      }
      setError(null);

      const result = await fetcher();
      
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + opts.ttl,
      });

      setData(result);
    } catch (err) {
      console.error(`[ApiCache] Error fetching ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [key, fetcher, opts.ttl]);

  useEffect(() => {
    const cachedEntry = cache.get(key);
    const now = Date.now();

    if (cachedEntry) {
      // We have cached data
      setData(cachedEntry.data);
      setLoading(false);

      // Check if cache is expired
      if (now >= cachedEntry.expiresAt) {
        // Cache expired
        if (opts.staleWhileRevalidate) {
          // Return stale data but fetch fresh in background
          fetchData(false);
        } else {
          // Fetch fresh data with loading state
          fetchData(true);
        }
      }
    } else {
      // No cached data, fetch fresh
      fetchData(true);
    }
  }, [key, fetchData, opts.staleWhileRevalidate]);

  const mutate = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const clear = useCallback(() => {
    cache.delete(key);
    setData(null);
    setError(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    isRevalidating,
    mutate,
    clear,
  };
}

/**
 * Clear all cached entries
 */
export function clearAllCache() {
  cache.clear();
  console.log('[ApiCache] All cache entries cleared');
}

/**
 * Clear cache entries matching a pattern
 */
export function clearCachePattern(pattern: RegExp) {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (pattern.test(key)) {
      cache.delete(key);
      cleared++;
    }
  }
  console.log(`[ApiCache] Cleared ${cleared} cache entries matching pattern`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(cache.entries());
  
  return {
    totalEntries: entries.length,
    activeEntries: entries.filter(([_, entry]) => now < entry.expiresAt).length,
    expiredEntries: entries.filter(([_, entry]) => now >= entry.expiresAt).length,
    totalSizeBytes: JSON.stringify(entries).length,
  };
}
