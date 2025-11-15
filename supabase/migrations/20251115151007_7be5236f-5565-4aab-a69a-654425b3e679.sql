-- Fix kategorisering: Uppdatera alla gamla kategorier till nya korrekta kategorier
UPDATE species_captures
SET ai_analysis = jsonb_set(
  ai_analysis,
  '{species,category}',
  to_jsonb(CASE 
    -- Spår (gamla: "spar")
    WHEN ai_analysis->'species'->>'category' = 'spar' THEN 'spår'
    
    -- Träd och Vedartade
    WHEN ai_analysis->'species'->>'category' = 'barrtrad' THEN 'barrträd'
    WHEN ai_analysis->'species'->>'category' = 'lovtrad' THEN 'lövträd'
    
    -- Mossor och Lavar
    WHEN ai_analysis->'species'->>'category' = 'bladmossor' THEN 'mossa'
    WHEN ai_analysis->'species'->>'category' = 'levermossor' THEN 'mossa'
    
    -- Örter och Blommor
    WHEN ai_analysis->'species'->>'category' = 'orkideer' THEN 'blomma'
    WHEN ai_analysis->'species'->>'category' = 'blommor' THEN 'blomma'
    WHEN ai_analysis->'species'->>'category' = 'fröväxter' THEN 'ört'
    
    -- Behåll om redan korrekt
    ELSE ai_analysis->'species'->>'category'
  END)
)
WHERE ai_analysis->'species'->>'category' IN (
  'spar', 'barrtrad', 'lovtrad', 'bladmossor', 'levermossor', 
  'orkideer', 'blommor', 'fröväxter'
);