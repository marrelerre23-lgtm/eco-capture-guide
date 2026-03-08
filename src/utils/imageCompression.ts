/**
 * Compress an image to reduce file size before upload
 * Supports both JPEG and WebP formats for better compression
 * @param dataUrl - Base64 data URL of the image
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @param quality - Image quality 0-1 (default: 0.85)
 * @param format - Output format 'jpeg' or 'webp' (default: 'webp')
 * @returns Compressed image as data URL
 */
export const compressImage = async (
  dataUrl: string,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85,
  format: 'jpeg' | 'webp' = 'webp'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d', { 
        alpha: false, // Disable alpha channel for better compression
        willReadFrequently: false 
      });
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Choose format based on browser support
      const mimeType = format === 'webp' && supportsWebP() 
        ? 'image/webp' 
        : 'image/jpeg';
      
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      
      console.log(`[ImageCompression] Original: ${(dataUrl.length / 1024).toFixed(0)}KB → Compressed: ${(compressedDataUrl.length / 1024).toFixed(0)}KB (${mimeType})`);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
};

/**
 * Check if browser supports WebP format
 */
let webpSupport: boolean | null = null;
export const supportsWebP = (): boolean => {
  if (webpSupport !== null) return webpSupport;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  return webpSupport;
};

