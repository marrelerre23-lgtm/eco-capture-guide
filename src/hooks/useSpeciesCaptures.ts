import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface SpeciesCapture {
  id: string;
  image_url: string;
  captured_at: string;
  ai_analysis: Json | null;
  notes?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

// Helper type for parsed AI analysis
export interface ParsedSpeciesCapture extends Omit<SpeciesCapture, 'ai_analysis'> {
  ai_analysis: {
    species: {
      commonName: string;
      scientificName: string;
      category: string;
      confidence: number;
      description: string;
      habitat?: string;
      identificationFeatures?: string;
      rarity?: string;
      sizeInfo?: string;
    };
  } | null;
}

export const useSpeciesCaptures = () => {
  return useQuery({
    queryKey: ["species-captures"],
    queryFn: async (): Promise<ParsedSpeciesCapture[]> => {
      const { data, error } = await supabase
        .from("species_captures")
        .select("*")
        .order("captured_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(capture => ({
        ...capture,
        ai_analysis: capture.ai_analysis as ParsedSpeciesCapture['ai_analysis']
      }));
    },
  });
};