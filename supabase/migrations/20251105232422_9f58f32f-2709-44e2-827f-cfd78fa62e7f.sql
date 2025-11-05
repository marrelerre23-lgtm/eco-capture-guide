-- Add is_favorite column to species_captures table
ALTER TABLE public.species_captures
ADD COLUMN is_favorite boolean DEFAULT false;