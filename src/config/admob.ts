/**
 * Google AdMob Configuration
 * 
 * IMPORTANT: For web applications, use Google AdSense instead of AdMob.
 * AdMob is primarily for mobile apps (iOS/Android).
 * 
 * For future mobile app development, configure these values:
 * - Get your AdMob App ID from: https://apps.admob.com/
 * - Create Ad Units in AdMob console
 * 
 * For current web version:
 * - Use Google AdSense (https://www.google.com/adsense/)
 * - AdSense Publisher ID format: pub-XXXXXXXXXXXXXXXX
 */

export const ADMOB_CONFIG = {
  // AdMob App ID (for future mobile app)
  // Format: ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
  appId: process.env.ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713', // Test ID
  
  // Ad Unit IDs (for future mobile app)
  adUnits: {
    // Interstitial ad (full-screen ad before analysis)
    interstitial: process.env.ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712', // Test ID
    
    // Rewarded ad (video ad for bonuses)
    rewarded: process.env.ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917', // Test ID
    
    // Banner ad (bottom banner in logbook/overview)
    banner: process.env.ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111', // Test ID
  },
  
  // AdSense Configuration (for current web version)
  adSense: {
    // Get from: https://www.google.com/adsense/
    // Format: pub-XXXXXXXXXXXXXXXX
    publisherId: process.env.ADSENSE_PUBLISHER_ID || '', // TODO: Add your AdSense Publisher ID
    
    // Ad slot IDs (created in AdSense)
    adSlots: {
      banner: process.env.ADSENSE_BANNER_SLOT || '', // TODO: Add banner ad slot
      interstitial: process.env.ADSENSE_INTERSTITIAL_SLOT || '', // TODO: Add interstitial slot
    },
  },
  
  // Test mode flag
  isTestMode: process.env.NODE_ENV === 'development',
};

/**
 * Check if real ads are configured
 */
export const hasRealAdsConfigured = (): boolean => {
  return !!(ADMOB_CONFIG.adSense.publisherId && ADMOB_CONFIG.adSense.publisherId !== '');
};

/**
 * Load Google AdSense script
 */
export const loadAdSenseScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!ADMOB_CONFIG.adSense.publisherId) {
      console.warn('⚠️ AdSense Publisher ID not configured. Using test mode.');
      resolve();
      return;
    }

    // Check if script already loaded
    if (document.querySelector(`script[src*="adsbygoogle.js"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADMOB_CONFIG.adSense.publisherId}`;
    
    script.onload = () => {
      console.log('✅ Google AdSense loaded');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google AdSense');
      reject(new Error('Failed to load AdSense'));
    };

    document.head.appendChild(script);
  });
};
