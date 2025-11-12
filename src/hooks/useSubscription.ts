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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptionInfo = async () => {
    try {
      console.log('🔍 [useSubscription] Fetching subscription info...');
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ [useSubscription] Error fetching user:', userError);
        setError(`User error: ${userError.message}`);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('⚠️ [useSubscription] No user found');
        setLoading(false);
        return;
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
        
        // Set default free tier if profile doesn't exist
        setSubscription({
          tier: 'free',
          analysesRemaining: 5,
          analysesToday: 0,
          capturesRemaining: 50,
          capturesCount: 0,
          maxAnalysesPerDay: 5,
          maxCaptures: 50,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
        });
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('⚠️ [useSubscription] No profile found, using defaults');
        setSubscription({
          tier: 'free',
          analysesRemaining: 5,
          analysesToday: 0,
          capturesRemaining: 50,
          capturesCount: 0,
          maxAnalysesPerDay: 5,
          maxCaptures: 50,
          isAnalysisLimitReached: false,
          isCaptureLimitReached: false,
        });
        setLoading(false);
        return;
      }

      console.log('📊 [useSubscription] Profile data:', profile);

      const analysesRemaining = profile.max_analyses_per_day 
        ? Math.max(0, profile.max_analyses_per_day - (profile.analyses_today || 0))
        : Infinity;

      const capturesRemaining = profile.max_captures
        ? Math.max(0, profile.max_captures - (profile.captures_count || 0))
        : null;

      const tier: 'free' | 'premium' | 'pro' = 
        profile.subscription_tier === 'premium' ? 'premium' :
        profile.subscription_tier === 'pro' ? 'pro' : 'free';

      const subscriptionInfo: SubscriptionInfo = {
        tier,
        analysesRemaining: analysesRemaining === Infinity ? 999 : analysesRemaining,
        analysesToday: profile.analyses_today || 0,
        capturesRemaining,
        capturesCount: profile.captures_count || 0,
        maxAnalysesPerDay: profile.max_analyses_per_day,
        maxCaptures: profile.max_captures,
        isAnalysisLimitReached: analysesRemaining === 0,
        isCaptureLimitReached: capturesRemaining === 0,
      };

      console.log('✅ [useSubscription] Subscription info:', subscriptionInfo);
      setSubscription(subscriptionInfo);
      setLoading(false);
    } catch (err) {
      console.error('❌ [useSubscription] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set default free tier on unexpected error
      setSubscription({
        tier: 'free',
        analysesRemaining: 5,
        analysesToday: 0,
        capturesRemaining: 50,
        capturesCount: 0,
        maxAnalysesPerDay: 5,
        maxCaptures: 50,
        isAnalysisLimitReached: false,
        isCaptureLimitReached: false,
      });
      setLoading(false);
    }
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
    error,
    checkCanAnalyze,
    checkCanCapture,
    refetch: fetchSubscriptionInfo,
  };
};
