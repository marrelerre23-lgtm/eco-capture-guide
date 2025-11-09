-- Add GPS accuracy to species_captures
ALTER TABLE public.species_captures
ADD COLUMN IF NOT EXISTS gps_accuracy numeric;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements (read-only for all users)
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert predefined achievements
INSERT INTO public.achievements (key, name, description, icon, category, requirement_value) VALUES
('first_capture', 'Första fångsten', 'Ta din första bild av en art', '🎯', 'start', 1),
('10_captures', '10 fångster', 'Fånga 10 olika arter', '📸', 'capture', 10),
('25_captures', '25 fångster', 'Fånga 25 olika arter', '📷', 'capture', 25),
('50_captures', '50 fångster', 'Fånga 50 olika arter', '🎬', 'capture', 50),
('100_captures', 'Centurion', 'Fånga 100 olika arter', '🏆', 'capture', 100),
('first_rare', 'Sällsynt fynd', 'Hitta din första sällsynta art', '⭐', 'rarity', 1),
('mushroom_hunter', 'Svampjägare', 'Fånga 5 olika svampar', '🍄', 'category', 5),
('botanist', 'Botanist', 'Fånga 10 olika växter', '🌿', 'category', 10),
('tree_hugger', 'Trädkramare', 'Fånga 5 olika träd', '🌳', 'category', 5),
('explorer', 'Upptäcktsresande', 'Besök 5 olika platser', '🗺️', 'location', 5),
('week_streak', '7-dagars streak', 'Fånga något varje dag i en vecka', '🔥', 'streak', 7),
('favorite_collector', 'Favorit-samlare', 'Markera 10 fångster som favoriter', '💖', 'favorite', 10)
ON CONFLICT (key) DO NOTHING;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();