import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Play, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface RewardedAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'analysis' | 'capture';
  onRewardClaimed?: () => void;
}

export const RewardedAdDialog = ({ 
  open, 
  onOpenChange, 
  type,
  onRewardClaimed 
}: RewardedAdDialogProps) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const { toast } = useToast();

  const rewardInfo = type === 'analysis' 
    ? {
        title: 'Få 5 Extra Analyser',
        description: 'Titta på en kort videoannons för att få +5 extra AI-analyser idag',
        icon: Sparkles,
        reward: '+5 analyser idag'
      }
    : {
        title: 'Få 5 Extra Lagringsplatser',
        description: 'Titta på en kort videoannons för att få +5 permanenta lagringsplatser i din loggbok',
        icon: Gift,
        reward: '+5 platser permanent'
      };

  const Icon = rewardInfo.icon;

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdProgress(0);

    // Simulate ad playback (15 seconds)
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleAdCompleted();
          return 100;
        }
        return prev + (100 / 15); // 15 seconds total
      });
    }, 1000);
  };

  const handleAdCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call add_rewarded_bonus function
      const { error } = await supabase.rpc('add_rewarded_bonus', {
        user_id_input: user.id,
        bonus_type: type
      });

      if (error) throw error;

      toast({
        title: "Belöning mottagen! 🎉",
        description: type === 'analysis' 
          ? "Du har fått +5 extra AI-analyser för idag!"
          : "Du har fått +5 extra permanenta lagringsplatser!",
        duration: 5000,
      });

      onRewardClaimed?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to claim reward:', error);
      toast({
        title: "Kunde inte ge belöning",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsWatchingAd(false);
      setAdProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-warning/20 to-accent/20 p-4 rounded-full">
              <Icon className="h-12 w-12 text-warning" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {rewardInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {rewardInfo.description}
          </DialogDescription>
        </DialogHeader>

        {!isWatchingAd ? (
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-warning/10 to-accent/10 rounded-lg p-4 border border-warning/20">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="h-5 w-5 text-warning" />
                <span className="font-semibold text-foreground">Din belöning:</span>
              </div>
              <p className="text-lg font-bold text-warning ml-8">
                {rewardInfo.reward}
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-warning to-accent hover:from-warning/90 hover:to-accent/90"
                onClick={handleWatchAd}
              >
                <Play className="mr-2 h-5 w-5" />
                Titta på videoannons (15 sek)
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Eller uppgradera till Premium för obegränsad användning
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center space-y-2">
                  <Play className="h-12 w-12 mx-auto animate-pulse" />
                  <p className="text-sm">Spelar videoannons...</p>
                  <p className="text-xs opacity-70">
                    {Math.ceil((100 - adProgress) / (100 / 15))} sekunder kvar
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-warning to-accent transition-all duration-1000"
                  style={{ width: `${adProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Vänligen titta klart för att få din belöning
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
