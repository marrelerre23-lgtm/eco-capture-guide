-- Data Migration: Map old categories to new 11-category structure
-- This updates all existing species_captures to use the new detailed categories

-- Create a helper function to map old to new categories
CREATE OR REPLACE FUNCTION migrate_category(old_category text, old_ai_analysis jsonb)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  ai_category text;
  new_category text;
BEGIN
  -- Extract AI category from ai_analysis if available
  ai_category := old_ai_analysis->'species'->>'category';
  
  -- Map based on old category and AI analysis
  CASE 
    -- Träd och Vedartade
    WHEN old_category IN ('trees', 'träd', 'Träd') OR ai_category ILIKE '%träd%' OR ai_category ILIKE '%ved%' THEN
      new_category := 'barrtrad';
    
    -- Örter och Blommor
    WHEN old_category IN ('plants', 'växter', 'Växter', 'flowers', 'blommor') OR ai_category ILIKE '%blomma%' OR ai_category ILIKE '%ört%' THEN
      new_category := 'orkideer';
    
    -- Mossor och Lavar
    WHEN old_category IN ('moss', 'mossor', 'Mossor') OR ai_category ILIKE '%mossa%' OR ai_category ILIKE '%lav%' THEN
      new_category := 'bladmossor';
    
    -- Svampar
    WHEN old_category IN ('mushrooms', 'svampar', 'Svampar') OR ai_category ILIKE '%svamp%' THEN
      new_category := 'rorsvampar';
    
    -- Fåglar
    WHEN old_category IN ('birds', 'fåglar', 'Fåglar') OR ai_category ILIKE '%fågel%' THEN
      new_category := 'rovfaglar';
    
    -- Däggdjur
    WHEN old_category IN ('mammals', 'däggdjur', 'Däggdjur') OR ai_category ILIKE '%däggdjur%' THEN
      new_category := 'hovdjur';
    
    -- Grod- och Kräldjur
    WHEN old_category IN ('reptiles', 'amphibians', 'kräldjur', 'grodor') OR ai_category ILIKE '%groda%' OR ai_category ILIKE '%ödla%' OR ai_category ILIKE '%orm%' THEN
      new_category := 'grodor';
    
    -- Insekter och Spindeldjur
    WHEN old_category IN ('insects', 'insekter', 'Insekter', 'spiders') OR ai_category ILIKE '%insekt%' OR ai_category ILIKE '%spindel%' THEN
      new_category := 'fjarilar';
    
    -- Vatten- och Ryggradslöst Liv
    WHEN old_category IN ('aquatic', 'water', 'vatten') OR ai_category ILIKE '%vatten%' OR ai_category ILIKE '%snäcka%' THEN
      new_category := 'snackor';
    
    -- Stenar & Mineraler
    WHEN old_category IN ('minerals', 'stones', 'stenar', 'mineraler') OR ai_category ILIKE '%sten%' OR ai_category ILIKE '%mineral%' THEN
      new_category := 'mineral';
    
    -- Spår och Övrigt (default/fallback)
    ELSE
      new_category := 'spar';
  END CASE;
  
  RETURN new_category;
END;
$$;

-- Update all existing captures with new categories
UPDATE species_captures
SET ai_analysis = jsonb_set(
  COALESCE(ai_analysis, '{}'::jsonb),
  '{species,category}',
  to_jsonb(migrate_category(
    COALESCE(ai_analysis->'species'->>'category', 'annat'),
    ai_analysis
  ))
)
WHERE ai_analysis IS NOT NULL;

-- Clean up the helper function
DROP FUNCTION migrate_category(text, jsonb);

-- Add a comment to track migration
COMMENT ON COLUMN species_captures.ai_analysis IS 'AI analysis data - migrated to 11-category structure on 2025-01-13';