// Analysis result cache with short TTL to prevent accidental duplicates

const ANALYSIS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedAnalysis {
  result: any;
  timestamp: number;
  hash: string;
}

// Generate a hash from image data AND category hint
const generateImageHash = async (dataUrl: string, categoryHint?: string | null): Promise<string> => {
  const encoder = new TextEncoder();
  const dataToHash = dataUrl.substring(0, 10000) + (categoryHint || 'auto');
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get cached analysis result if it exists and is not expired
export const getCachedAnalysis = async (imageDataUrl: string, categoryHint?: string | null): Promise<any | null> => {
  try {
    const hash = await generateImageHash(imageDataUrl, categoryHint);
    const cacheKey = `analysis_${hash}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const parsedCache: CachedAnalysis = JSON.parse(cached);
    const now = Date.now();
    
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
export const setCachedAnalysis = async (imageDataUrl: string, result: any, categoryHint?: string | null) => {
  try {
    const hash = await generateImageHash(imageDataUrl, categoryHint);
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
