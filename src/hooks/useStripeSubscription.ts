import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StripeSubscriptionStatus {
  subscribed: boolean;
  tier: 'free' | 'premium' | 'pro';
  subscription_end: string | null;
}

export const useStripeSubscription = () => {
  const [status, setStatus] = useState<StripeSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    try {
      console.log('🔍 [useStripeSubscription] Checking subscription status...');
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('⚠️ [useStripeSubscription] No active session');
        setStatus({ subscribed: false, tier: 'free', subscription_end: null });
        setLoading(false);
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        console.error('❌ [useStripeSubscription] Error:', invokeError);
        setError(invokeError.message);
        setStatus({ subscribed: false, tier: 'free', subscription_end: null });
      } else {
        console.log('✅ [useStripeSubscription] Status:', data);
        setStatus(data);
      }
    } catch (err) {
      console.error('❌ [useStripeSubscription] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({ subscribed: false, tier: 'free', subscription_end: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();

    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    loading,
    error,
    refetch: checkSubscription,
  };
};
