import { useCallback } from 'react';
import { toast } from 'sonner';

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
  const checkLimit = useCallback((): boolean => {
    const now = Date.now();
    const state = rateLimitStore.get(key);

    if (!state || now > state.resetTime) {
      rateLimitStore.set(key, {
        attempts: 1,
        resetTime: now + config.windowMs,
      });
      return false;
    }

    if (state.attempts < config.maxAttempts) {
      state.attempts++;
      rateLimitStore.set(key, state);
      return false;
    }

    const remainingTime = Math.ceil((state.resetTime - now) / 1000);
    toast.error('För många försök', {
      description: config.message || `Vänta ${remainingTime} sekunder innan du försöker igen.`,
    });

    return true;
  }, [key, config]);

  const reset = useCallback(() => {
    rateLimitStore.delete(key);
  }, [key]);

  return {
    checkLimit,
    reset,
  };
};
