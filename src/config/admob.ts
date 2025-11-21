/**
 * Google AdMob Configuration
 * 
 * For native mobile app (iOS/Android) with Capacitor.
 * 
 * IMPORTANT: Real AdMob credentials should be configured in Supabase Secrets:
 * - ADMOB_APP_ID_ANDROID: Your real Android App ID
 * - ADMOB_BANNER_ID_ANDROID: Your real Banner Ad Unit ID
 * - ADMOB_INTERSTITIAL_ID_ANDROID: Your real Interstitial Ad Unit ID
 * - ADMOB_REWARDED_ID_ANDROID: Your real Rewarded Ad Unit ID
 * 
 * For testing, we use Google's test ad unit IDs.
 */

/**
 * Get AdMob configuration based on platform
 * For production, these values come from environment/secrets
 */
export const getAdMobConfig = () => {
  const platform = typeof window !== 'undefined' 
    ? (window as any).Capacitor?.getPlatform() || 'web'
    : 'web';
  
  const isNative = platform === 'ios' || platform === 'android';

  // For native Android app
  if (isNative && platform === 'android') {
    // TODO: Replace with actual Supabase secrets in production
    // These test IDs should be replaced with:
    // - Real App ID: ca-app-pub-5095846544588256~1694925896
    // - Get real Ad Unit IDs from AdMob console
    const appId = 'ca-app-pub-3940256099942544~3347511713'; // TEST ID - replace in production
    const bannerAdUnitId = 'ca-app-pub-3940256099942544/6300978111'; // TEST ID
    const interstitialAdUnitId = 'ca-app-pub-3940256099942544/1033173712'; // TEST ID
    const rewardedAdUnitId = 'ca-app-pub-3940256099942544/5224354917'; // TEST ID
    
    return {
      appId,
      adUnits: {
        interstitial: interstitialAdUnitId,
        rewarded: rewardedAdUnitId,
        banner: bannerAdUnitId,
      },
      platform,
      isTestMode: true, // Change to false when using real ad unit IDs
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

/**
 * PRODUCTION SETUP INSTRUCTIONS:
 * ================================
 * 1. Go to AdMob Console: https://apps.admob.com/
 * 2. Create Ad Units for your app
 * 3. Replace the test IDs above with your real Ad Unit IDs
 * 4. Set isTestMode to false
 * 5. Test thoroughly before publishing
 * 
 * Your Real App ID: ca-app-pub-5095846544588256~1694925896
 * (Get your real ad unit IDs from AdMob console)
 */
