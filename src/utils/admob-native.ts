/**
 * Native AdMob Integration
 * 
 * This module provides helper functions for native AdMob ads using
 * @capacitor-community/admob plugin. These functions only work in
 * native iOS/Android apps built with Capacitor.
 */

import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdSize, 
  BannerAdPosition,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  AdMobRewardItem
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Standard height for AdMob banner ads (in pixels)
 */
export const ADMOB_BANNER_HEIGHT = 50;

/**
 * Get the height of the AdMob banner ad
 */
export const getAdMobBannerHeight = (): number => {
  return ADMOB_BANNER_HEIGHT;
};

/**
 * Check if running in native app
 */
export const isNativeApp = (): boolean => {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android';
};

/**
 * Initialize AdMob with the app ID
 * Should be called once at app startup
 */
export const initializeAdMob = async (): Promise<void> => {
  if (!isNativeApp()) {
    console.log('[AdMob] Skipping initialization - not running in native app');
    return;
  }

  try {
    // Get the appropriate app ID based on platform
    const platform = Capacitor.getPlatform();
    const testAppId = platform === 'ios' 
      ? 'ca-app-pub-3940256099942544~1458002511'  // iOS test app ID
      : 'ca-app-pub-3940256099942544~3347511713'; // Android test app ID

    // For production, these would come from environment/secrets
    // For now, we use test IDs
    await AdMob.initialize({
      initializeForTesting: true, // Set to false in production
    });

    console.log('[AdMob] Initialized successfully');
  } catch (error) {
    console.error('[AdMob] Failed to initialize:', error);
  }
};

/**
 * Show an interstitial ad (full-screen ad)
 * Used before AI analysis for free users
 */
export const showInterstitialAd = async (adUnitId: string): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log('[AdMob] Skipping interstitial - not running in native app');
    return false;
  }

  try {
    console.log('[AdMob] Preparing interstitial ad...');
    
    // Prepare the ad
    await AdMob.prepareInterstitial({
      adId: adUnitId,
    });

    // Show the ad
    await AdMob.showInterstitial();
    
    console.log('[AdMob] Interstitial ad shown successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show interstitial:', error);
    return false;
  }
};

/**
 * Show a rewarded video ad
 * Used to give users extra analyses or storage
 */
export const showRewardedAd = async (
  adUnitId: string,
  onRewarded: (reward: AdMobRewardItem) => void,
  onDismissed: () => void
): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log('[AdMob] Skipping rewarded ad - not running in native app');
    return false;
  }

  try {
    console.log('[AdMob] Preparing rewarded ad...');

    // Set up event listeners
    const rewardedListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        console.log('[AdMob] Reward earned:', reward);
        onRewarded(reward);
        rewardedListener.remove();
      }
    );

    const dismissedListener = await AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        console.log('[AdMob] Rewarded ad dismissed');
        onDismissed();
        dismissedListener.remove();
      }
    );

    // Prepare and show the ad
    await AdMob.prepareRewardVideoAd({
      adId: adUnitId,
    });

    await AdMob.showRewardVideoAd();
    
    console.log('[AdMob] Rewarded ad shown successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show rewarded ad:', error);
    return false;
  }
};

/**
 * Show a banner ad at the bottom of the screen
 * Used in Logbook and Overview pages for free users
 */
export const showBannerAd = async (adUnitId: string): Promise<boolean> => {
  if (!isNativeApp()) {
    console.log('[AdMob] Skipping banner - not running in native app');
    return false;
  }

  try {
    console.log('[AdMob] Showing banner ad...');

    const options: BannerAdOptions = {
      adId: adUnitId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };

    await AdMob.showBanner(options);
    
    console.log('[AdMob] Banner ad shown successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] Failed to show banner:', error);
    return false;
  }
};

/**
 * Hide the banner ad
 */
export const hideBannerAd = async (): Promise<void> => {
  if (!isNativeApp()) {
    return;
  }

  try {
    await AdMob.hideBanner();
    console.log('[AdMob] Banner ad hidden');
  } catch (error) {
    console.error('[AdMob] Failed to hide banner:', error);
  }
};

/**
 * Remove the banner ad completely
 */
export const removeBannerAd = async (): Promise<void> => {
  if (!isNativeApp()) {
    return;
  }

  try {
    await AdMob.removeBanner();
    console.log('[AdMob] Banner ad removed');
  } catch (error) {
    console.error('[AdMob] Failed to remove banner:', error);
  }
};
