-- Backfill edibility and age_stage for existing captures that have NULL values
-- Set them to 'okänd' as a baseline (users can re-analyze for accurate data)
UPDATE species_captures
SET 
  edibility = 'okänd',
  age_stage = 'okänd'
WHERE edibility IS NULL OR age_stage IS NULL;