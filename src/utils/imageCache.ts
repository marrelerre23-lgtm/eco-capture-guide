/**
 * Image cache management utilities
 * Prevents unlimited cache growth by limiting stored items and implementing LRU eviction
 */

const CACHE_KEY = 'ecocapture_image_cache';
const MAX_CACHE_SIZE = 50;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  imageHash: string;
  result: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface ImageCache {
  entries: Record<string, CacheEntry>;
  version: number;
}

const getCache = (): ImageCache => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) {
      return { entries: {}, version: 1 };
    }
    
    const cache = JSON.parse(stored) as ImageCache;
    const now = Date.now();
    const validEntries: Record<string, CacheEntry> = {};
    
    for (const [key, entry] of Object.entries(cache.entries)) {
      if (now - entry.timestamp < MAX_CACHE_AGE) {
        validEntries[key] = entry;
      }
    }
    
    return { ...cache, entries: validEntries };
  } catch (error) {
    console.error('Error loading cache:', error);
    return { entries: {}, version: 1 };
  }
};

const saveCache = (cache: ImageCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving cache:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldestEntries(10);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch (retryError) {
        console.error('Failed to save cache after cleanup:', retryError);
      }
    }
  }
};

const generateCacheKey = (imageHash: string, location?: { latitude: number; longitude: number } | null): string => {
  if (!location) return imageHash;
  const lat = location.latitude.toFixed(4);
  const lng = location.longitude.toFixed(4);
  return `${imageHash}_${lat}_${lng}`;
};

export const getCachedResult = (imageHash: string, location?: { latitude: number; longitude: number } | null): any | null => {
  const cache = getCache();
  const cacheKey = generateCacheKey(imageHash, location);
  const entry = cache.entries[cacheKey];
  
  if (!entry) return null;
  
  entry.accessCount++;
  entry.lastAccessed = Date.now();
  cache.entries[cacheKey] = entry;
  saveCache(cache);
  
  return entry.result;
};

export const setCachedResult = (imageHash: string, result: any, location?: { latitude: number; longitude: number } | null): void => {
  const cache = getCache();
  const now = Date.now();
  const cacheKey = generateCacheKey(imageHash, location);
  
  if (Object.keys(cache.entries).length >= MAX_CACHE_SIZE && !cache.entries[cacheKey]) {
    evictLRUEntries(cache);
  }
  
  cache.entries[cacheKey] = {
    imageHash: cacheKey,
    result,
    timestamp: now,
    accessCount: 1,
    lastAccessed: now
  };
  
  saveCache(cache);
};

const evictLRUEntries = (cache: ImageCache): void => {
  const entries = Object.entries(cache.entries);
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  const removeCount = Math.ceil(entries.length * 0.2);
  
  for (let i = 0; i < removeCount; i++) {
    delete cache.entries[entries[i][0]];
  }
  
  console.log(`Evicted ${removeCount} LRU cache entries`);
};

const clearOldestEntries = (count: number): void => {
  const cache = getCache();
  const entries = Object.entries(cache.entries);
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  for (let i = 0; i < Math.min(count, entries.length); i++) {
    delete cache.entries[entries[i][0]];
  }
  
  saveCache(cache);
  console.log(`Cleared ${Math.min(count, entries.length)} oldest cache entries`);
};
