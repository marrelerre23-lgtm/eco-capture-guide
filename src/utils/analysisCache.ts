// Analysis result cache with short TTL to prevent accidental duplicates
// but still show ads for "real" analyses

const ANALYSIS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedAnalysis {
  result: any;
  timestamp: number;
  hash: string;
}

// Generate a hash from image data
const generateImageHash = async (dataUrl: string): Promise<string> => {
  const encoder = new TextEncoder();
  // Sample first 10KB for performance
  const data = encoder.encode(dataUrl.substring(0, 10000));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get cached analysis result if it exists and is not expired
export const getCachedAnalysis = async (imageDataUrl: string): Promise<any | null> => {
  try {
    const hash = await generateImageHash(imageDataUrl);
    const cacheKey = `analysis_${hash}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsedCache: CachedAnalysis = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired (older than 5 minutes)
    if (now - parsedCache.timestamp > ANALYSIS_CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log('Using cached analysis result (expires in', Math.round((ANALYSIS_CACHE_TTL - (now - parsedCache.timestamp)) / 1000), 'seconds)');
    return parsedCache.result;
  } catch (error) {
    console.error('Error getting cached analysis:', error);
    return null;
  }
};

// Cache an analysis result
export const setCachedAnalysis = async (imageDataUrl: string, result: any) => {
  try {
    const hash = await generateImageHash(imageDataUrl);
    const cacheKey = `analysis_${hash}`;
    
    const cacheData: CachedAnalysis = {
      result,
      timestamp: Date.now(),
      hash,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('Analysis result cached with 5-minute TTL');
  } catch (error) {
    console.error('Error caching analysis:', error);
  }
};

// Clear expired analysis cache entries
export const clearExpiredAnalysisCache = () => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('analysis_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsedCache: CachedAnalysis = JSON.parse(cached);
            if (now - parsedCache.timestamp > ANALYSIS_CACHE_TTL) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key); // Remove invalid entries
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Cleared ${keysToRemove.length} expired analysis cache entries`);
    }
  } catch (error) {
    console.error('Error clearing expired analysis cache:', error);
  }
};
