import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from './ui/button';
import { Sparkles, X } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { hasRealAdsConfigured, ADMOB_CONFIG } from '@/config/admob';
import { isNativeApp, showInterstitialAd } from '@/utils/admob-native';

interface AdDisplayProps {
  onAdComplete?: () => void;
  onSkip?: () => void;
}

export const AdDisplay = ({ onAdComplete, onSkip }: AdDisplayProps) => {
  const { subscription } = useSubscription();
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const hasRealAds = hasRealAdsConfigured();

  useEffect(() => {
    // Skip ads for premium users
    if (subscription?.tier !== 'free') {
      onAdComplete?.();
      return;
    }

    // If running in native app, show native AdMob interstitial
    if (isNativeApp()) {
      const showNativeAd = async () => {
        try {
          analytics.trackAd(ANALYTICS_EVENTS.AD_SHOWN, 'interstitial', {
            isNative: true,
            platform: ADMOB_CONFIG.platform,
          });

          const success = await showInterstitialAd(ADMOB_CONFIG.adUnits.interstitial);
          
          if (success) {
            analytics.trackAd(ANALYTICS_EVENTS.AD_CLOSED, 'interstitial');
          }
          
          // Complete regardless of success/failure
          onAdComplete?.();
        } catch (error) {
          console.error('[AdDisplay] Native ad error:', error);
          onAdComplete?.();
        }
      };

      showNativeAd();
      return;
    }

    // Web version: Skip ads (only show in native app)
    console.log('[AdDisplay] Web environment - skipping ad display');
    onAdComplete?.();
    return;
  }, [subscription, onAdComplete, hasRealAds]);

  // Don't show anything for premium users
  if (subscription?.tier !== 'free') {
    return null;
  }

  const handleClose = () => {
    if (canClose) {
      analytics.trackAd(ANALYTICS_EVENTS.AD_CLOSED, 'interstitial');
      onAdComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6 relative">
        {canClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">
              {hasRealAds ? 'Annons' : 'EcoCapture Premium'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasRealAds 
                ? 'Annons spelas upp...' 
                : 'Uppgradera för en annons-fri upplevelse'
              }
            </p>
          </div>

          {hasRealAds ? (
            <div className="bg-muted rounded-lg p-4 min-h-[250px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Annonsyta</p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <div className="text-sm text-muted-foreground">
                Med Premium får du:
              </div>
              <ul className="text-sm space-y-1 text-left">
                <li>✓ Obegränsade AI-analyser</li>
                <li>✓ Ingen annonser</li>
                <li>✓ Obegränsat antal fångster</li>
                <li>✓ Avancerad statistik</li>
              </ul>
            </div>
          )}

          {!canClose && (
            <div className="text-sm text-muted-foreground">
              Du kan fortsätta om {countdown} sekunder...
            </div>
          )}

          {canClose ? (
            <div className="space-y-2">
              <Button onClick={handleClose} className="w-full">
                Fortsätt med analys
              </Button>
              {!hasRealAds && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    analytics.track(ANALYTICS_EVENTS.UPGRADE_CLICKED, {
                      source: 'ad_display',
                    });
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Uppgradera till Premium
                </Button>
              )}
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
