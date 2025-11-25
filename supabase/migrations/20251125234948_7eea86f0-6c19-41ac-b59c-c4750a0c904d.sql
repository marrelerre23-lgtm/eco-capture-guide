-- Remove analysis limits and set capture limit to 500
-- This temporarily removes all monetization features

-- Update all existing users to unlimited analyses and 500 captures
UPDATE public.profiles 
SET 
  max_analyses_per_day = NULL,  -- NULL = unlimited
  max_captures = 500,
  analyses_today = 0,
  rewarded_analyses_today = 0,
  extra_captures_from_ads = 0
WHERE TRUE;

-- Update check_user_limits function to remove analysis limits
CREATE OR REPLACE FUNCTION public.check_user_limits(user_id_input uuid, action_type text)
RETURNS TABLE(allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile RECORD;
  total_captures_allowed INT;
BEGIN
  -- Authorization check: Users can only check their own limits
  -- SERVICE_ROLE calls (from Edge Functions) bypass this check
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check limits for other users';
  END IF;

  SELECT * INTO user_profile FROM public.profiles WHERE user_id = user_id_input;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User profile not found'::TEXT;
    RETURN;
  END IF;
  
  IF action_type = 'analysis' THEN
    -- No analysis limits - always allow
    RETURN QUERY SELECT TRUE, NULL::TEXT;
    
  ELSIF action_type = 'capture' THEN
    -- Calculate total allowed captures (base 500 + any extra from ads)
    total_captures_allowed := COALESCE(user_profile.max_captures, 500) + COALESCE(user_profile.extra_captures_from_ads, 0);
    
    -- Check if user has reached capture limit
    IF user_profile.captures_count >= total_captures_allowed THEN
      RETURN QUERY SELECT FALSE, format('Din loggbok är full (%s/%s fångster).', user_profile.captures_count, total_captures_allowed)::TEXT;
    ELSE
      RETURN QUERY SELECT TRUE, NULL::TEXT;
    END IF;
  END IF;
END;
$$;

-- Update increment_usage_counter to handle unlimited analyses
CREATE OR REPLACE FUNCTION public.increment_usage_counter(user_id_input uuid, action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization check: Users can only increment their own counters
  -- SERVICE_ROLE calls (from Edge Functions) bypass this check
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot increment counters for other users';
  END IF;

  IF action_type = 'analysis' THEN
    -- Just increment the total count, no daily limit enforcement
    UPDATE public.profiles 
    SET 
      analyses_count = analyses_count + 1,
      analyses_today = analyses_today + 1,
      last_analysis_date = CURRENT_DATE
    WHERE user_id = user_id_input;
  ELSIF action_type = 'capture' THEN
    UPDATE public.profiles 
    SET captures_count = captures_count + 1
    WHERE user_id = user_id_input;
  END IF;
END;
$$;