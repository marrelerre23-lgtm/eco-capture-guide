import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'pro';
  analysesRemaining: number;
  analysesToday: number;
  capturesRemaining: number | null; // null = unlimited
  capturesCount: number;
  maxAnalysesPerDay: number | null;
  maxCaptures: number | null;
  isAnalysisLimitReached: boolean;
  isCaptureLimitReached: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubscriptionInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
      return;
    }

    const analysesRemaining = profile.max_analyses_per_day 
      ? Math.max(0, profile.max_analyses_per_day - (profile.analyses_today || 0))
      : Infinity;

    const capturesRemaining = profile.max_captures
      ? Math.max(0, profile.max_captures - (profile.captures_count || 0))
      : null;

    const tier = (profile.subscription_tier === 'premium' || profile.subscription_tier === 'pro')
      ? profile.subscription_tier
      : 'free';

    setSubscription({
      tier,
      analysesRemaining: analysesRemaining === Infinity ? 999 : analysesRemaining,
      analysesToday: profile.analyses_today || 0,
      capturesRemaining,
      capturesCount: profile.captures_count || 0,
      maxAnalysesPerDay: profile.max_analyses_per_day,
      maxCaptures: profile.max_captures,
      isAnalysisLimitReached: analysesRemaining === 0,
      isCaptureLimitReached: capturesRemaining === 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const checkCanAnalyze = async (): Promise<boolean> => {
    await fetchSubscriptionInfo();
    
    if (subscription && subscription.isAnalysisLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Analysgräns nådd',
        description: 'Du har använt alla dina analyser för idag. Uppgradera till Premium för obegränsade analyser!',
      });
      return false;
    }
    
    return true;
  };

  const checkCanCapture = async (): Promise<boolean> => {
    await fetchSubscriptionInfo();
    
    if (subscription?.isCaptureLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Lagringsgräns nådd',
        description: `Du har nått gränsen på ${subscription.maxCaptures} fångster. Uppgradera till Premium för obegränsat utrymme!`,
      });
      return false;
    }
    
    return true;
  };

  return {
    subscription,
    loading,
    checkCanAnalyze,
    checkCanCapture,
    refetch: fetchSubscriptionInfo,
  };
};
