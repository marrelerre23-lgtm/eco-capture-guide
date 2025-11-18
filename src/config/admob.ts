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

/**
 * Get AdMob configuration based on platform
 * For native apps, these would be fetched from environment/secrets
 * For web, we use test IDs
 */
export const getAdMobConfig = () => {
  const platform = typeof window !== 'undefined' 
    ? (window as any).Capacitor?.getPlatform() || 'web'
    : 'web';
  
  const isNative = platform === 'ios' || platform === 'android';

  // For native Android app, use real Ad Unit IDs
  // These are stored as Supabase secrets: ADMOB_APP_ID_ANDROID, etc.
  // In production build, these would be replaced via build process
  
  if (isNative && platform === 'android') {
    return {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Android test - replace with real
      adUnits: {
        interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test - replace with real
        rewarded: 'ca-app-pub-3940256099942544/5224354917', // Test - replace with real
        banner: 'ca-app-pub-3940256099942544/6300978111', // Test - replace with real
      },
      platform,
      isTestMode: true, // Set to false when using real IDs
    };
  }

  // For iOS, use iOS test IDs
  if (isNative && platform === 'ios') {
    return {
      appId: 'ca-app-pub-3940256099942544~1458002511', // iOS test
      adUnits: {
        interstitial: 'ca-app-pub-3940256099942544/4411468910', // iOS test
        rewarded: 'ca-app-pub-3940256099942544/1712485313', // iOS test
        banner: 'ca-app-pub-3940256099942544/2934735716', // iOS test
      },
      platform,
      isTestMode: true,
    };
  }

  // For web, use Android test IDs (web simulation)
  return {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    adUnits: {
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
      banner: 'ca-app-pub-3940256099942544/6300978111',
    },
    platform,
    isTestMode: true,
  };
};

export const ADMOB_CONFIG = getAdMobConfig();

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
