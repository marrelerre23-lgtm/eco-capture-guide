/**
 * Google AdMob Configuration
 * 
 * For native mobile app (iOS/Android) with Capacitor.
 * Configure these values after setting up your AdMob account:
 * - Get your AdMob App ID from: https://apps.admob.com/
 * - Create Ad Units in AdMob console
 * 
 * SETUP STEPS:
 * 1. Create AdMob account at https://apps.admob.com/
 * 2. Register your app (one for iOS, one for Android)
 * 3. Create ad units (Interstitial, Rewarded, Banner)
 * 4. Replace test IDs below with your real ad unit IDs
 * 5. Add ADMOB_APP_ID, ADMOB_INTERSTITIAL_ID, ADMOB_REWARDED_ID, ADMOB_BANNER_ID as secrets
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
  
  // Platform detection
  platform: typeof window !== 'undefined' 
    ? (window as any).Capacitor?.getPlatform() || 'web'
    : 'web',
  
  // Test mode flag
  isTestMode: process.env.NODE_ENV === 'development',
};

/**
 * Check if real ads are configured
 */
export const hasRealAdsConfigured = (): boolean => {
  const appId = ADMOB_CONFIG.appId;
  // Real AdMob app IDs don't start with test ID prefix
  return !!(appId && !appId.includes('3940256099942544'));
};

/**
 * Check if running in native mobile app
 */
export const isNativeApp = (): boolean => {
  return ADMOB_CONFIG.platform === 'ios' || ADMOB_CONFIG.platform === 'android';
};
