-- Create species_info table for storing species data
CREATE TABLE public.species_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scientific_name TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plant', 'mushroom', 'insect', 'bird', 'animal')),
  description TEXT,
  habitat TEXT,
  size_info TEXT,
  identification_features TEXT,
  rarity_level TEXT CHECK (rarity_level IN ('common', 'uncommon', 'rare', 'very_rare')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create species_captures table for user captures
CREATE TABLE public.species_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_info_id UUID REFERENCES public.species_info(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_analysis JSONB,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.species_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_captures ENABLE ROW LEVEL SECURITY;

-- RLS policies for species_info (public read access)
CREATE POLICY "Anyone can view species info" 
ON public.species_info 
FOR SELECT 
USING (true);

-- RLS policies for species_captures (user-specific access)
CREATE POLICY "Users can view their own captures" 
ON public.species_captures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own captures" 
ON public.species_captures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own captures" 
ON public.species_captures 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own captures" 
ON public.species_captures 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_species_info_updated_at
  BEFORE UPDATE ON public.species_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_species_captures_updated_at
  BEFORE UPDATE ON public.species_captures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for capture images
INSERT INTO storage.buckets (id, name, public) VALUES ('captures', 'captures', true);

-- Create storage policies for capture images
CREATE POLICY "Users can view all capture images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'captures');

CREATE POLICY "Users can upload their own capture images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own capture images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own capture images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert some sample species data
INSERT INTO public.species_info (scientific_name, common_name, category, description, habitat, rarity_level) VALUES
('Amanita muscaria', 'Flugsvamp', 'mushroom', 'En ikonisk röd svamp med vita prickar. Mycket giftig men också en av världens mest kända svampar.', 'Barrskog, särskilt under björk och gran', 'common'),
('Vaccinium myrtillus', 'Blåbär', 'plant', 'En låg buske som ger läckra blå bär. Växer vilt i skandinaviska skogar.', 'Barrskog och ljunghed', 'common'),
('Entoloma nidorosum', 'Stinkbitterskivling', 'mushroom', 'En mindre svamp med stark, obehaglig lukt. Kan vara svår att identifiera för nybörjare.', 'Löv- och blandskog', 'uncommon');