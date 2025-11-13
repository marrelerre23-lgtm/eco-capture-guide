-- Update profiles table for freemium model
-- Change max_analyses_per_day from 5 to 15 for free users
-- Set max_captures to 100 for free users
-- Add rewarded ads tracking columns

ALTER TABLE public.profiles
ALTER COLUMN max_analyses_per_day SET DEFAULT 15;

-- Add columns for rewarded ads bonuses
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rewarded_analyses_today INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_captures_from_ads INT DEFAULT 0;

-- Update existing free users to have correct limits
UPDATE public.profiles
SET 
  max_analyses_per_day = 15,
  max_captures = 100,
  rewarded_analyses_today = 0,
  extra_captures_from_ads = 0
WHERE subscription_tier = 'free' OR subscription_tier IS NULL;

-- Update check_user_limits function to include rewarded bonuses
CREATE OR REPLACE FUNCTION public.check_user_limits(user_id_input uuid, action_type text)
RETURNS TABLE(allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile RECORD;
  today_date DATE := CURRENT_DATE;
  total_analyses_allowed INT;
  total_captures_allowed INT;
BEGIN
  -- Authorization check
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check limits for other users';
  END IF;

  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_id_input;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User profile not found'::TEXT;
    RETURN;
  END IF;
  
  IF action_type = 'analysis' THEN
    -- Reset daily counters if it's a new day
    IF user_profile.last_analysis_date IS NULL OR user_profile.last_analysis_date != today_date THEN
      UPDATE public.profiles 
      SET analyses_today = 0, rewarded_analyses_today = 0, last_analysis_date = today_date 
      WHERE user_id = user_id_input;
      user_profile.analyses_today := 0;
      user_profile.rewarded_analyses_today := 0;
    END IF;
    
    -- Calculate total allowed analyses (base + rewarded)
    total_analyses_allowed := COALESCE(user_profile.max_analyses_per_day, 999999) + COALESCE(user_profile.rewarded_analyses_today, 0);
    
    -- Check if user has reached limit (NULL means unlimited for premium)
    IF user_profile.max_analyses_per_day IS NOT NULL AND user_profile.analyses_today >= total_analyses_allowed THEN
      RETURN QUERY SELECT FALSE, 'Du har nått din dagliga gräns för analyser. Titta på en annons för +5 analyser eller uppgradera till Premium!'::TEXT;
    ELSE
      RETURN QUERY SELECT TRUE, NULL::TEXT;
    END IF;
    
  ELSIF action_type = 'capture' THEN
    -- Calculate total allowed captures (base + rewarded permanent bonuses)
    total_captures_allowed := COALESCE(user_profile.max_captures, 999999) + COALESCE(user_profile.extra_captures_from_ads, 0);
    
    -- Check if user has reached capture limit (NULL means unlimited)
    IF user_profile.max_captures IS NOT NULL AND user_profile.captures_count >= total_captures_allowed THEN
      RETURN QUERY SELECT FALSE, format('Din loggbok är full (%s/%s fångster). Titta på en annons för +5 platser eller uppgradera till Premium!', user_profile.captures_count, total_captures_allowed)::TEXT;
    ELSE
      RETURN QUERY SELECT TRUE, NULL::TEXT;
    END IF;
  END IF;
END;
$$;

-- Create function to add rewarded ad bonuses
CREATE OR REPLACE FUNCTION public.add_rewarded_bonus(user_id_input uuid, bonus_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot add bonuses for other users';
  END IF;

  IF bonus_type = 'analysis' THEN
    -- Add +5 extra analyses for today
    UPDATE public.profiles 
    SET rewarded_analyses_today = COALESCE(rewarded_analyses_today, 0) + 5
    WHERE user_id = user_id_input;
  ELSIF bonus_type = 'capture' THEN
    -- Add +5 permanent extra capture slots
    UPDATE public.profiles 
    SET extra_captures_from_ads = COALESCE(extra_captures_from_ads, 0) + 5
    WHERE user_id = user_id_input;
  END IF;
END;
$$;