-- Add subscription and usage tracking columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS analyses_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS captures_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS analyses_today INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_analysis_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_captures INTEGER DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_analyses_per_day INTEGER DEFAULT 5;

-- Set defaults for existing free users
UPDATE public.profiles 
SET max_analyses_per_day = 5, max_captures = 50 
WHERE subscription_tier = 'free' OR subscription_tier IS NULL;

-- Function to check if user has reached their limits
CREATE OR REPLACE FUNCTION public.check_user_limits(user_id_input UUID, action_type TEXT)
RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
  user_profile RECORD;
  today_date DATE := CURRENT_DATE;
BEGIN
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_id_input;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User profile not found'::TEXT;
    RETURN;
  END IF;
  
  IF action_type = 'analysis' THEN
    -- Reset daily counter if it's a new day
    IF user_profile.last_analysis_date IS NULL OR user_profile.last_analysis_date != today_date THEN
      UPDATE public.profiles 
      SET analyses_today = 0, last_analysis_date = today_date 
      WHERE user_id = user_id_input;
      user_profile.analyses_today := 0;
    END IF;
    
    -- Check if user has reached daily analysis limit (NULL means unlimited)
    IF user_profile.max_analyses_per_day IS NOT NULL AND user_profile.analyses_today >= user_profile.max_analyses_per_day THEN
      RETURN QUERY SELECT FALSE, 'Du har nått din dagliga gräns för analyser. Uppgradera till Premium för obegränsade analyser!'::TEXT;
    ELSE
      RETURN QUERY SELECT TRUE, NULL::TEXT;
    END IF;
    
  ELSIF action_type = 'capture' THEN
    -- Check if user has reached capture limit (NULL means unlimited)
    IF user_profile.max_captures IS NOT NULL AND user_profile.captures_count >= user_profile.max_captures THEN
      RETURN QUERY SELECT FALSE, format('Du har nått gränsen på %s fångster. Uppgradera till Premium för obegränsat utrymme!', user_profile.max_captures)::TEXT;
    ELSE
      RETURN QUERY SELECT TRUE, NULL::TEXT;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION public.increment_usage_counter(user_id_input UUID, action_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF action_type = 'analysis' THEN
    UPDATE public.profiles 
    SET analyses_today = analyses_today + 1, 
        analyses_count = analyses_count + 1,
        last_analysis_date = CURRENT_DATE
    WHERE user_id = user_id_input;
  ELSIF action_type = 'capture' THEN
    UPDATE public.profiles 
    SET captures_count = captures_count + 1
    WHERE user_id = user_id_input;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;