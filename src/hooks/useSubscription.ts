import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'pro';
  analysesRemaining: number;
  analysesToday: number;
  capturesRemaining: number | null; // null = unlimited
  capturesCount: number;
  baseMaxAnalysesPerDay: number | null; // Base limit without bonuses
  maxAnalysesPerDay: number | null; // Total including bonuses
  maxCaptures: number | null;
  isAnalysisLimitReached: boolean;
  isCaptureLimitReached: boolean;
  subscription_end: string | null;
  rewardedAnalysesToday: number;
  extraCapturesFromAds: number;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
    try {
      console.log('🔍 [useSubscription] Fetching subscription info...');
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ [useSubscription] Error fetching user:', userError);
        setError(`User error: ${userError.message}`);
        const defaultInfo: SubscriptionInfo = {
          tier: 'free',
          analysesRemaining: 999,
          analysesToday: 0,
          capturesRemaining: 500,
          capturesCount: 0,
          baseMaxAnalysesPerDay: null, // unlimited
          maxAnalysesPerDay: null, // unlimited
          maxCaptures: 500,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
          subscription_end: null,
          rewardedAnalysesToday: 0,
          extraCapturesFromAds: 0,
        };
        setSubscription(defaultInfo);
        setLoading(false);
        return defaultInfo;
      }
      
      if (!user) {
        console.log('⚠️ [useSubscription] No user found');
        const defaultInfo: SubscriptionInfo = {
          tier: 'free',
          analysesRemaining: 999,
          analysesToday: 0,
          capturesRemaining: 500,
          capturesCount: 0,
          baseMaxAnalysesPerDay: null, // unlimited
          maxAnalysesPerDay: null, // unlimited
          maxCaptures: 500,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
          subscription_end: null,
          rewardedAnalysesToday: 0,
          extraCapturesFromAds: 0,
        };
        setSubscription(defaultInfo);
        setLoading(false);
        return defaultInfo;
      }

      console.log('✅ [useSubscription] User found:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ [useSubscription] Error fetching profile:', profileError);
        setError(`Profile error: ${profileError.message}`);
        
        const defaultInfo: SubscriptionInfo = {
          tier: 'free',
          analysesRemaining: 999,
          analysesToday: 0,
          capturesRemaining: 500,
          capturesCount: 0,
          baseMaxAnalysesPerDay: null, // unlimited
          maxAnalysesPerDay: null, // unlimited
          maxCaptures: 500,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
          subscription_end: null,
          rewardedAnalysesToday: 0,
          extraCapturesFromAds: 0,
        };
        setSubscription(defaultInfo);
        setLoading(false);
        return defaultInfo;
      }

      if (!profile) {
        console.log('⚠️ [useSubscription] No profile found, using defaults');
        const defaultInfo: SubscriptionInfo = {
          tier: 'free',
          analysesRemaining: 999,
          analysesToday: 0,
          capturesRemaining: 500,
          capturesCount: 0,
          baseMaxAnalysesPerDay: null, // unlimited
          maxAnalysesPerDay: null, // unlimited
          maxCaptures: 500,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
          subscription_end: null,
          rewardedAnalysesToday: 0,
          extraCapturesFromAds: 0,
        };
        setSubscription(defaultInfo);
        setLoading(false);
        return defaultInfo;
      }

      console.log('📊 [useSubscription] Profile data:', profile);

      // Calculate total analyses available - now unlimited
      const baseMaxAnalyses = profile.max_analyses_per_day; // null = unlimited
      const rewardedAnalyses = profile.rewarded_analyses_today || 0;
      const totalMaxAnalyses = baseMaxAnalyses ? (baseMaxAnalyses + rewardedAnalyses) : null;
      
      const analysesRemaining = totalMaxAnalyses 
        ? Math.max(0, totalMaxAnalyses - (profile.analyses_today || 0))
        : 999; // Show 999 for unlimited

      // Calculate total captures available (base 500 + extra from ads)
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
        isAnalysisLimitReached: false, // Never reached - unlimited
        isCaptureLimitReached: capturesRemaining === 0,
        subscription_end: profile.subscription_expires_at || null,
        rewardedAnalysesToday: rewardedAnalyses,
        extraCapturesFromAds: extraCaptures,
      };

      console.log('✅ [useSubscription] Subscription info:', subscriptionInfo);
      setSubscription(subscriptionInfo);
      setLoading(false);
      return subscriptionInfo;
    } catch (err) {
      console.error('❌ [useSubscription] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      const defaultInfo: SubscriptionInfo = {
        tier: 'free',
        analysesRemaining: 999,
        analysesToday: 0,
        capturesRemaining: 500,
        capturesCount: 0,
        baseMaxAnalysesPerDay: null, // unlimited
        maxAnalysesPerDay: null, // unlimited
        maxCaptures: 500,
        isAnalysisLimitReached: false,
        isCaptureLimitReached: false,
        subscription_end: null,
        rewardedAnalysesToday: 0,
        extraCapturesFromAds: 0,
      };
      setSubscription(defaultInfo);
      setLoading(false);
      return defaultInfo;
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
    
    // #13: Realtime subscription updates for instant premium upgrade detection
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
          (payload) => {
            console.log('🔄 [useSubscription] Realtime profile update:', payload);
            fetchSubscriptionInfo();
          }
        )
        .subscribe();
    };

    setupRealtimeListener();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      fetchSubscriptionInfo();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const checkCanAnalyze = async (): Promise<boolean> => {
    // No longer enforcing analysis limits
    return true;
  };

  const checkCanCapture = async (): Promise<boolean> => {
    // FIX #2: Return value directly from fetch to avoid race condition
    const currentInfo = await fetchSubscriptionInfo();
    
    if (currentInfo.isCaptureLimitReached) {
      toast({
        variant: 'destructive',
        title: 'Lagringsgräns nådd',
        description: `Du har nått gränsen på ${currentInfo.maxCaptures} fångster. Uppgradera till Premium för obegränsat utrymme!`,
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
