import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

interface RateLimitState {
  attempts: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

export const useRateLimit = (key: string, config: RateLimitConfig) => {
  const [isLimited, setIsLimited] = useState(false);
  const { toast } = useToast();

  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = rateLimitStore.get(key);

    // No previous attempts or window expired
    if (!state || now > state.resetTime) {
      rateLimitStore.set(key, {
        attempts: 1,
        resetTime: now + config.windowMs,
      });
      setIsLimited(false);
      return false;
    }

    // Increment attempts
    if (state.attempts < config.maxAttempts) {
      state.attempts++;
      rateLimitStore.set(key, state);
      setIsLimited(false);
      return false;
    }

    // Rate limit exceeded
    const remainingTime = Math.ceil((state.resetTime - now) / 1000);
    
    toast({
      variant: 'destructive',
      title: 'För många försök',
      description: config.message || `Vänta ${remainingTime} sekunder innan du försöker igen.`,
    });

    setIsLimited(true);
    return true;
  }, [key, config, toast]);

  const reset = useCallback(() => {
    rateLimitStore.delete(key);
    setIsLimited(false);
  }, [key]);

  return {
    checkLimit,
    reset,
    isLimited,
  };
};
