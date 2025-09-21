import { supabase } from "@/integrations/supabase/client";

export interface SpeciesInfo {
  id: string;
  scientific_name: string;
  common_name: string;
  category: string;
  description: string;
  habitat?: string;
  size_info?: string;
  identification_features?: string;
  rarity_level?: string;
  created_at: string;
  updated_at: string;
}

export interface SpeciesCapture {
  id: string;
  user_id: string;
  species_info_id?: string;
  image_url: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  captured_at: string;
  ai_analysis?: any;
  notes?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  species_info?: SpeciesInfo;
}

export const getSpeciesCaptures = async (): Promise<SpeciesCapture[]> => {
  const { data, error } = await supabase
    .from('species_captures')
    .select(`
      *,
      species_info (*)
    `)
    .order('captured_at', { ascending: false });

  if (error) {
    console.error('Error fetching captures:', error);
    throw new Error(`Kunde inte hämta fångster: ${error.message}`);
  }

  return data || [];
};

export const saveSpeciesCapture = async (captureData: {
  image_url: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  ai_analysis?: any;
  notes?: string;
  species_info_id?: string;
}): Promise<SpeciesCapture> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error("Användaren måste vara inloggad");
  }

  const { data, error } = await supabase
    .from('species_captures')
    .insert({
      user_id: user.data.user.id,
      ...captureData
    })
    .select(`
      *,
      species_info (*)
    `)
    .single();

  if (error) {
    console.error('Error saving capture:', error);
    throw new Error(`Kunde inte spara fångsten: ${error.message}`);
  }

  return data;
};

export const updateSpeciesCapture = async (
  id: string, 
  updates: Partial<SpeciesCapture>
): Promise<SpeciesCapture> => {
  const { data, error } = await supabase
    .from('species_captures')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      species_info (*)
    `)
    .single();

  if (error) {
    console.error('Error updating capture:', error);
    throw new Error(`Kunde inte uppdatera fångsten: ${error.message}`);
  }

  return data;
};

export const deleteSpeciesCapture = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('species_captures')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting capture:', error);
    throw new Error(`Kunde inte ta bort fångsten: ${error.message}`);
  }
};

export const getAllSpeciesInfo = async (): Promise<SpeciesInfo[]> => {
  const { data, error } = await supabase
    .from('species_info')
    .select('*')
    .order('common_name');

  if (error) {
    console.error('Error fetching species info:', error);
    throw new Error(`Kunde inte hämta artinformation: ${error.message}`);
  }

  return data || [];
};

export const searchSpeciesByName = async (searchTerm: string): Promise<SpeciesInfo[]> => {
  const { data, error } = await supabase
    .from('species_info')
    .select('*')
    .or(`common_name.ilike.%${searchTerm}%,scientific_name.ilike.%${searchTerm}%`)
    .order('common_name');

  if (error) {
    console.error('Error searching species:', error);
    throw new Error(`Kunde inte söka arter: ${error.message}`);
  }

  return data || [];
};