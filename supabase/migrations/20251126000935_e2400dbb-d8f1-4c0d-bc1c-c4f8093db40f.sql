-- Remove edibility column from species_captures
ALTER TABLE public.species_captures DROP COLUMN IF EXISTS edibility;

-- Remove any references to edibility in triggers or functions if they exist
-- (No triggers or functions currently reference edibility based on the schema)