import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'pro';
  analysesRemaining: number;
  analysesToday: number;
  capturesRemaining: number | null;
  capturesCount: number;
  baseMaxAnalysesPerDay: number | null;
  maxAnalysesPerDay: number | null;
  maxCaptures: number | null;
  isAnalysisLimitReached: boolean;
  isCaptureLimitReached: boolean;
  subscription_end: string | null;
  rewardedAnalysesToday: number;
  extraCapturesFromAds: number;
}

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  tier: 'free',
  analysesRemaining: 999,
  analysesToday: 0,
  capturesRemaining: 500,
  capturesCount: 0,
  baseMaxAnalysesPerDay: null,
  maxAnalysesPerDay: null,
  maxCaptures: 500,
  isAnalysisLimitReached: false,
  isCaptureLimitReached: false,
  subscription_end: null,
  rewardedAnalysesToday: 0,
  extraCapturesFromAds: 0,
};

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
    try {
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setSubscription(DEFAULT_SUBSCRIPTION);
        setLoading(false);
        return DEFAULT_SUBSCRIPTION;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setSubscription(DEFAULT_SUBSCRIPTION);
        setLoading(false);
        return DEFAULT_SUBSCRIPTION;
      }

      const baseMaxAnalyses = profile.max_analyses_per_day;
      const rewardedAnalyses = profile.rewarded_analyses_today || 0;
      const totalMaxAnalyses = baseMaxAnalyses ? (baseMaxAnalyses + rewardedAnalyses) : null;
      
      const analysesRemaining = totalMaxAnalyses 
        ? Math.max(0, totalMaxAnalyses - (profile.analyses_today || 0))
        : 999;

      const baseMaxCaptures = profile.max_captures || 500;
      const extraCaptures = profile.extra_captures_from_ads || 0;
      const totalMaxCaptures = baseMaxCaptures + extraCaptures;
      
      const capturesRemaining = profile.max_captures
        ? Math.max(0, totalMaxCaptures - (profile.captures_count || 0))
        : null;

      const tier: 'free' | 'premium' | 'pro' = 
        profile.subscription_tier === 'premium' ? 'premium' :
        profile.subscription_tier === 'pro' ? 'pro' : 'free';

      const subscriptionInfo: SubscriptionInfo = {
        tier,
        analysesRemaining,
        analysesToday: profile.analyses_today || 0,
        capturesRemaining,
        capturesCount: profile.captures_count || 0,
        baseMaxAnalysesPerDay: baseMaxAnalyses,
        maxAnalysesPerDay: totalMaxAnalyses,
        maxCaptures: totalMaxCaptures,
        isAnalysisLimitReached: false,
        isCaptureLimitReached: capturesRemaining === 0,
        subscription_end: profile.subscription_expires_at || null,
        rewardedAnalysesToday: rewardedAnalyses,
        extraCapturesFromAds: extraCaptures,
      };

      setSubscription(subscriptionInfo);
      setLoading(false);
      return subscriptionInfo;
    } catch (err) {
      console.error('[useSubscription] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubscription(DEFAULT_SUBSCRIPTION);
      setLoading(false);
      return DEFAULT_SUBSCRIPTION;
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
    
    let realtimeChannel: RealtimeChannel | null = null;
    
    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      realtimeChannel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchSubscriptionInfo();
          }
        )
        .subscribe();
    };

    setupRealtimeListener();
    
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const checkCanAnalyze = async (): Promise<boolean> => {
    return true;
  };

  const checkCanCapture = async (): Promise<boolean> => {
    const currentInfo = await fetchSubscriptionInfo();
    
    if (currentInfo.isCaptureLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Lagringsgräns nådd',
        description: `Du har nått gränsen på ${currentInfo.maxCaptures} fångster.`,
      });
      return false;
    }
    
    return true;
  };

  return {
    subscription,
    loading,
    error,
    checkCanAnalyze,
    checkCanCapture,
    refetch: fetchSubscriptionInfo,
  };
};
