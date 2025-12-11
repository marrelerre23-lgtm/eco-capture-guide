import { useState, useEffect } from 'react';
import { getSignedCaptureUrl } from '@/utils/signedUrl';

// Cache for signed URLs to avoid regenerating them
const urlCache = new Map<string, { url: string; expires: number }>();
const CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (slightly less than 1 hour signed URL validity)

/**
 * Hook to get a signed URL for a capture image
 */
export const useSignedUrl = (imageUrl: string | null | undefined) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = urlCache.get(imageUrl);
    if (cached && cached.expires > Date.now()) {
      setSignedUrl(cached.url);
      setLoading(false);
      return;
    }

    // Generate new signed URL
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        const url = await getSignedCaptureUrl(imageUrl);
        
        // Cache the URL
        urlCache.set(imageUrl, {
          url,
          expires: Date.now() + CACHE_DURATION
        });
        
        setSignedUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError(err instanceof Error ? err : new Error('Failed to get signed URL'));
        // Fallback to original URL
        setSignedUrl(imageUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [imageUrl]);

  return { signedUrl, loading, error };
};

/**
 * Batch get signed URLs for multiple images
 */
export const getSignedUrls = async (imageUrls: string[]): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  
  const promises = imageUrls.map(async (url) => {
    // Check cache
    const cached = urlCache.get(url);
    if (cached && cached.expires > Date.now()) {
      return { original: url, signed: cached.url };
    }
    
    // Generate signed URL
    const signed = await getSignedCaptureUrl(url);
    
    // Cache it
    urlCache.set(url, {
      url: signed,
      expires: Date.now() + CACHE_DURATION
    });
    
    return { original: url, signed };
  });
  
  const results = await Promise.all(promises);
  results.forEach(({ original, signed }) => {
    result.set(original, signed);
  });
  
  return result;
};
