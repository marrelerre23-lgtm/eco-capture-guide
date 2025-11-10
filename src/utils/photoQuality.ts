/**
 * Photo quality analysis utilities
 */

export interface QualityCheckResult {
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  passed: boolean;
}

/**
 * Analyze image quality from data URL
 */
export const analyzePhotoQuality = async (dataUrl: string): Promise<QualityCheckResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const issues: string[] = [];
    const warnings: string[] = [];
    
    img.onload = () => {
      let score = 100;
      
      // Check resolution
      const minWidth = 800;
      const minHeight = 800;
      
      if (img.width < minWidth || img.height < minHeight) {
        issues.push(`Låg upplösning (${img.width}x${img.height}px)`);
        score -= 30;
      } else if (img.width < 1200 || img.height < 1200) {
        warnings.push('Upplösningen kan vara högre för bättre analys');
        score -= 10;
      }
      
      // Check aspect ratio
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 2 || aspectRatio < 0.5) {
        warnings.push('Ovanlig bildproportioner - försök centrera motivet');
        score -= 10;
      }
      
      // Check brightness (approximate by converting to canvas and sampling)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        
        try {
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;
          let brightness = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            brightness += (r + g + b) / 3;
          }
          
          brightness = brightness / (100 * 100);
          
          if (brightness < 40) {
            issues.push('Bilden är för mörk');
            score -= 25;
          } else if (brightness < 70) {
            warnings.push('Bilden kan vara ljusare - använd mer belysning');
            score -= 10;
          } else if (brightness > 220) {
            issues.push('Bilden är överexponerad');
            score -= 20;
          }
        } catch (e) {
          // Canvas security error - skip brightness check
        }
      }
      
      const passed = score >= 60 && issues.length === 0;
      
      resolve({
        score: Math.max(0, score),
        issues,
        warnings,
        passed
      });
    };
    
    img.onerror = () => {
      resolve({
        score: 0,
        issues: ['Kunde inte ladda bilden'],
        warnings: [],
        passed: false
      });
    };
    
    img.src = dataUrl;
  });
};
