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
  uploading?: boolean;
}

const CATEGORIES = [
  { value: "svamp", label: "Svamp" },
  { value: "växt", label: "Växt" },
  { value: "fågel", label: "Fågel" },
  { value: "insekt", label: "Insekt" },
  { value: "däggdjur", label: "Däggdjur" },
  { value: "annat", label: "Annat" },
  { value: "okänt", label: "Okänt" },
];

export const PhotoPreview = ({ imageUrl, onRetake, uploading = false }: PhotoPreviewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      console.log('Laddar upp bild till Supabase...');
      
      // First upload the image to Supabase Storage
      const uploadedImageUrl = await uploadCaptureFromDataUrl(imageUrl);
      console.log('Bild uppladdad:', uploadedImageUrl);
      
      console.log('Startar AI-analys av bild...');
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-species', {
        body: { 
          imageUrl: uploadedImageUrl,
          category: selectedCategory || "okänt"
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        const errorMsg = error.message || 'Edge Function returnerade ett fel';
        throw new Error(`Analys misslyckades: ${errorMsg}`);
      }

      if (!data) {
        throw new Error('Inget svar från AI-analysen');
      }

      if (data.error) {
        throw new Error(`AI-fel: ${data.error}`);
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
            analysisResult.species.confidence ? `AI-säkerhet: ${Math.round(analysisResult.species.confidence * 100)}%` : "",
            analysisResult.species.category ? `Kategori: ${analysisResult.species.category}` : ""
          ].filter(Boolean) // Remove empty strings
        };
        
        // Navigate to analysis result page instead of calling onSave
        navigate('/analysis-result', { state: { species } });
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
    <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Decorative Nature Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Photo Preview */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full">
          <div className="rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
            <img 
              src={imageUrl} 
              alt="Captured" 
              className="w-full h-auto object-contain max-h-[60vh]"
            />
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 bg-white/90 text-foreground hover:bg-white backdrop-blur-sm shadow-lg"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/90 to-transparent backdrop-blur-sm px-6 pb-8 pt-16">
        <div className="max-w-2xl mx-auto space-y-4">
          {!selectedCategory ? (
            <>
              {/* Category Selection */}
              <div className="bg-card/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-border space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Vad försöker du fånga?</h3>
                  <p className="text-sm text-muted-foreground">Välj kategori för bättre AI-analys</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant="outline"
                      className="h-12 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-border hover:border-primary hover:bg-primary/10 hover:scale-105 transition-all font-medium"
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Retake Button */}
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-12 bg-card/90 backdrop-blur-sm border-2 hover:bg-muted"
                onClick={onRetake}
                disabled={uploading}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Ta om bild
              </Button>
            </>
          ) : (
            <>
              {/* Selected Category Display */}
              <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Vald kategori:</p>
                <p className="text-lg font-semibold text-primary">
                  {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </p>
              </div>

              {/* Analyze Button */}
              <Button 
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={handleAnalyze}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyserar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Analysera med AI
                  </>
                )}
              </Button>
              
              {/* Secondary Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 h-12 bg-card/90 backdrop-blur-sm border-2 hover:bg-muted"
                  onClick={() => setSelectedCategory(null)}
                  disabled={uploading}
                >
                  Ändra kategori
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 h-12 bg-card/90 backdrop-blur-sm border-2 hover:bg-muted"
                  onClick={onRetake}
                  disabled={uploading}
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Ta om
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};