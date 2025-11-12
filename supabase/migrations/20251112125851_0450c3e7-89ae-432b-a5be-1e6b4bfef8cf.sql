-- Add authorization checks to SECURITY DEFINER functions
-- This prevents privilege escalation where users could manipulate other users' limits

CREATE OR REPLACE FUNCTION public.check_user_limits(user_id_input uuid, action_type text)
 RETURNS TABLE(allowed boolean, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile RECORD;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Authorization check: Users can only check their own limits
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check limits for other users';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.increment_usage_counter(user_id_input uuid, action_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check: Users can only increment their own counters
  IF auth.uid() != user_id_input THEN
    RAISE EXCEPTION 'Unauthorized: Cannot increment counters for other users';
  END IF;

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
$function$;