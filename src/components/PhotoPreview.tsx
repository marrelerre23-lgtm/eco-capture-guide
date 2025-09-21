import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadCaptureFromDataUrl } from "@/utils/storage";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: Date;
  description: string;
  facts: string[];
}

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
  onSave?: (species: Species) => void;
  uploading?: boolean;
}

export const PhotoPreview = ({ imageUrl, onRetake, onSave, uploading = false }: PhotoPreviewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!onSave) return;
    
    try {
      console.log('Laddar upp bild till Supabase...');
      
      // First upload the image to Supabase Storage
      const uploadedImageUrl = await uploadCaptureFromDataUrl(imageUrl);
      console.log('Bild uppladdad:', uploadedImageUrl);
      
      console.log('Startar AI-analys av bild...');
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-species', {
        body: { imageUrl: uploadedImageUrl }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Analys misslyckades: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const analysisResult = data;
      console.log('Analys resultat:', analysisResult);

      if (analysisResult.species) {
        const species: Species = {
          id: crypto.randomUUID(),
          name: analysisResult.species.commonName || "Okänd art",
          scientificName: analysisResult.species.scientificName || "Okänd",
          image: uploadedImageUrl,
          dateFound: new Date(),
          description: analysisResult.species.description || "Ingen beskrivning tillgänglig",
          facts: [
            analysisResult.species.habitat ? `Habitat: ${analysisResult.species.habitat}` : "",
            analysisResult.species.identificationFeatures ? `Kännetecken: ${analysisResult.species.identificationFeatures}` : "",
            analysisResult.species.rarity ? `Sällsynthet: ${analysisResult.species.rarity}` : "",
            analysisResult.species.sizeInfo ? `Storlek: ${analysisResult.species.sizeInfo}` : "",
            analysisResult.species.confidence ? `AI-säkerhet: ${Math.round(analysisResult.species.confidence * 100)}%` : ""
          ].filter(Boolean) // Remove empty strings
        };
        
        onSave(species);
      } else {
        throw new Error('Ingen artidentifiering kunde göras');
      }
    } catch (error) {
      console.error('AI-analys misslyckades:', error);
      toast({
        title: "Analys misslyckades", 
        description: error instanceof Error ? error.message : "Kunde inte analysera bilden",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Photo Preview */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt="Captured" 
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        <div className="space-y-4">
          {/* Analyze Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white py-3"
            onClick={handleAnalyze}
            disabled={uploading}
          >
            {uploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {uploading ? "Sparar..." : "Analysera med AI"}
          </Button>
          
          {/* Secondary Actions */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 bg-black/50 border-white/20 text-white hover:bg-black/70"
              onClick={onRetake}
              disabled={uploading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Ta om
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};