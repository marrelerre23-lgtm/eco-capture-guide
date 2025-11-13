import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { analytics, ANALYTICS_EVENTS } from '@/utils/analytics';
import { hasRealAdsConfigured } from '@/config/admob';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  onClose?: () => void;
}

export const BannerAd = ({ position = 'bottom', onClose }: BannerAdProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { subscription } = useSubscription();
  const hasRealAds = hasRealAdsConfigured();

  useEffect(() => {
    // Don't show for premium users
    if (subscription?.tier !== 'free') {
      setIsVisible(false);
      return;
    }

    // Track banner ad shown
    analytics.trackAd(ANALYTICS_EVENTS.AD_SHOWN, 'banner', {
      position,
      hasRealAds,
    });
  }, [subscription, position, hasRealAds]);

  if (!isVisible || subscription?.tier !== 'free') return null;

  const handleClose = () => {
    analytics.trackAd(ANALYTICS_EVENTS.AD_CLOSED, 'banner', { position });
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div 
      className={`w-full bg-gradient-to-r from-muted/50 to-muted/30 border-y border-border/50 backdrop-blur-sm ${
        position === 'top' ? 'border-t' : 'border-b'
      }`}
    >
      <div className="relative max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {/* TODO: Replace with real AdSense banner unit when configured */}
            {hasRealAds ? (
              <div className="flex-1 min-h-[50px] bg-muted rounded flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Annonsyta (Banner)</p>
              </div>
            ) : (
              <>
                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">AD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    Annonsplats tillgänglig
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Uppgradera till Premium för en annonsfri upplevelse
                  </p>
                </div>
              </>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
