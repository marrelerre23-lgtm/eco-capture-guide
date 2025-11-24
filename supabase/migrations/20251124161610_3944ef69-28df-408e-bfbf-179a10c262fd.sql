-- Migration to fix miscategorized captures
-- This will correct species_captures that were incorrectly classified

-- Create a temporary function to recategorize captures
CREATE OR REPLACE FUNCTION fix_miscategorized_captures()
RETURNS TABLE(
  capture_id uuid,
  old_category text,
  new_category text,
  species_name text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  capture_record RECORD;
  ai_data jsonb;
  scientific_name text;
  common_name text;
  current_category text;
  corrected_category text;
BEGIN
  -- Loop through all captures with ai_analysis
  FOR capture_record IN 
    SELECT id, ai_analysis 
    FROM species_captures 
    WHERE ai_analysis IS NOT NULL
  LOOP
    ai_data := capture_record.ai_analysis;
    
    -- Extract species info (handle both alternatives array and direct species object)
    IF ai_data ? 'alternatives' AND jsonb_array_length(ai_data->'alternatives') > 0 THEN
      scientific_name := LOWER(COALESCE(ai_data->'alternatives'->0->'species'->>'scientificName', ''));
      common_name := LOWER(COALESCE(ai_data->'alternatives'->0->'species'->>'commonName', ''));
      current_category := LOWER(COALESCE(ai_data->'alternatives'->0->'species'->>'category', ''));
    ELSIF ai_data ? 'species' THEN
      scientific_name := LOWER(COALESCE(ai_data->'species'->>'scientificName', ''));
      common_name := LOWER(COALESCE(ai_data->'species'->>'commonName', ''));
      current_category := LOWER(COALESCE(ai_data->'species'->>'category', ''));
    ELSE
      CONTINUE;
    END IF;
    
    corrected_category := NULL;
    
    -- Apply the same correction logic as the edge function
    -- Check for climbing plants misclassified as flowers/herbs
    IF (common_name LIKE '%murgröna%' OR common_name LIKE '%humle%' OR 
        common_name LIKE '%vinranka%' OR common_name LIKE '%klätter%') 
       AND (current_category IN ('blomma', 'ört')) THEN
      corrected_category := 'klätterväxt';
    
    -- Check known species misclassified as "spår"
    ELSIF current_category = 'spår' THEN
      -- Barrträd
      IF scientific_name LIKE '%picea%' OR scientific_name LIKE '%pinus%' OR 
         common_name LIKE '%tall%' OR common_name LIKE '%gran%' THEN
        corrected_category := 'barrträd';
      -- Lövträd
      ELSIF scientific_name LIKE '%betula%' OR common_name LIKE '%björk%' OR
            scientific_name LIKE '%aesculus%' OR common_name LIKE '%kastanj%' OR
            scientific_name LIKE '%acer%' OR common_name LIKE '%lönn%' OR
            scientific_name LIKE '%quercus%' OR common_name LIKE '%ek%' THEN
        corrected_category := 'lövträd';
      -- Buskar
      ELSIF scientific_name LIKE '%calluna%' OR common_name LIKE '%ljung%' OR
            scientific_name LIKE '%vaccinium%' OR common_name LIKE '%blåbär%' OR
            scientific_name LIKE '%symphoricarpos%' OR common_name LIKE '%snöbär%' OR
            scientific_name LIKE '%rosa%' OR common_name LIKE '%ros%' THEN
        corrected_category := 'buske';
      -- Blommor/Örter
      ELSIF scientific_name LIKE '%taraxacum%' OR common_name LIKE '%maskros%' OR
            scientific_name LIKE '%trifolium%' OR common_name LIKE '%klöver%' OR
            scientific_name LIKE '%ranunculus%' OR common_name LIKE '%smörblomma%' OR
            scientific_name LIKE '%hylotelephium%' OR common_name LIKE '%kärleksört%' THEN
        corrected_category := 'blomma';
      ELSIF scientific_name LIKE '%plantago%' OR common_name LIKE '%groblad%' OR
            scientific_name LIKE '%artemisia%' OR common_name LIKE '%gråbo%' THEN
        corrected_category := 'ört';
      -- Gräs
      ELSIF scientific_name LIKE '%dactylis%' OR common_name LIKE '%hundäxing%' OR
            scientific_name LIKE '%poa%' OR common_name LIKE '%gröe%' THEN
        corrected_category := 'gräs';
      END IF;
    END IF;
    
    -- If we found a correction, update the capture
    IF corrected_category IS NOT NULL AND corrected_category != current_category THEN
      -- Update the category in the ai_analysis JSON
      IF ai_data ? 'alternatives' THEN
        ai_data := jsonb_set(
          ai_data,
          '{alternatives,0,species,category}',
          to_jsonb(corrected_category)
        );
      ELSIF ai_data ? 'species' THEN
        ai_data := jsonb_set(
          ai_data,
          '{species,category}',
          to_jsonb(corrected_category)
        );
      END IF;
      
      -- Update the capture
      UPDATE species_captures 
      SET ai_analysis = ai_data,
          updated_at = now()
      WHERE id = capture_record.id;
      
      -- Return the change for logging
      RETURN QUERY SELECT 
        capture_record.id,
        current_category,
        corrected_category,
        common_name;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Execute the fix and show results
SELECT * FROM fix_miscategorized_captures();

-- Drop the temporary function
DROP FUNCTION fix_miscategorized_captures();