-- Add edibility and age_stage columns to species_captures table
ALTER TABLE public.species_captures 
ADD COLUMN IF NOT EXISTS edibility text,
ADD COLUMN IF NOT EXISTS age_stage text;

COMMENT ON COLUMN public.species_captures.edibility IS 'Edibility status: edible, toxic, inedible, or unknown';
COMMENT ON COLUMN public.species_captures.age_stage IS 'Age or life stage of the organism: juvenile, adult, mature, etc.';

-- Update increment_usage_counter to prioritize rewarded bonuses
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
    -- First, try to consume from rewarded_analyses_today
    UPDATE public.profiles 
    SET 
      rewarded_analyses_today = CASE 
        WHEN COALESCE(rewarded_analyses_today, 0) > 0 
        THEN rewarded_analyses_today - 1 
        ELSE 0 
      END,
      analyses_today = CASE 
        WHEN COALESCE(rewarded_analyses_today, 0) > 0 
        THEN analyses_today  -- Don't increment if using rewarded
        ELSE analyses_today + 1  -- Increment base counter
      END,
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