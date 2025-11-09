import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, RotateCcw, Zap, Star, Microscope, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadCaptureFromDataUrl } from "@/utils/storage";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { TopNavigation } from "./TopNavigation";
import { PhotoTipsDialog } from "./PhotoTipsDialog";
import { User } from "@supabase/supabase-js";

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
  location?: { latitude: number; longitude: number; accuracy?: number } | null;
}

const CATEGORIES = [
  { value: "svamp", label: "🍄 Svamp" },
  { value: "växt", label: "🌿 Växt" },
  { value: "träd", label: "🌳 Träd" },
  { value: "mossa", label: "🌱 Mossa" },
  { value: "sten", label: "💎 Sten" },
  { value: "okänt", label: "❓ Okänt" },
];

const DETAIL_LEVELS = [
  { 
    value: "quick", 
    label: "Snabb", 
    icon: Zap,
    time: "5s",
    description: "Grundläggande identifiering för snabba resultat" 
  },
  { 
    value: "standard", 
    label: "Standard", 
    icon: Star,
    time: "10s",
    description: "Balanserad analys med bra precision" 
  },
  { 
    value: "deep", 
    label: "Djup", 
    icon: Microscope,
    time: "20s",
    description: "Detaljerad analys med högsta noggrannhet" 
  },
];

export const PhotoPreview = ({ imageUrl, onRetake, uploading = false, location }: PhotoPreviewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailLevel, setDetailLevel] = useState<string>("standard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tipsDialogOpen, setTipsDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      console.log('Laddar upp bild till Supabase...');
      
      // First upload the image to Supabase Storage
      const uploadedImageUrl = await uploadCaptureFromDataUrl(imageUrl);
      console.log('Bild uppladdad:', uploadedImageUrl);
      
      console.log('Startar AI-analys av bild...');
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-species', {
        body: { 
          imageUrl: uploadedImageUrl,
          category: selectedCategory || "okänt",
          detailLevel: detailLevel
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

      // Check if we have alternatives (new format) or single species (old format)
      if (analysisResult.alternatives && Array.isArray(analysisResult.alternatives)) {
        // Navigate to analysis result page with all alternatives
        navigate('/analysis-result', { 
          state: { 
            alternatives: analysisResult.alternatives.map((alt: any) => ({
              id: crypto.randomUUID(),
              name: alt.species.commonName || "Okänd art",
              scientificName: alt.species.scientificName || "Okänd",
              image: uploadedImageUrl,
              dateFound: new Date(),
              description: alt.species.description || "Ingen beskrivning tillgänglig",
              confidence: alt.species.confidence || 0.5,
              reasoning: alt.reasoning || "",
              facts: [
                alt.species.habitat ? `Habitat: ${alt.species.habitat}` : "",
                alt.species.identificationFeatures ? `Kännetecken: ${alt.species.identificationFeatures}` : "",
                alt.species.rarity ? `Sällsynthet: ${alt.species.rarity}` : "",
                alt.species.sizeInfo ? `Storlek: ${alt.species.sizeInfo}` : "",
                alt.species.confidence ? `AI-säkerhet: ${Math.round(alt.species.confidence * 100)}%` : "",
                alt.species.category ? `Kategori: ${alt.species.category}` : ""
              ].filter(Boolean)
            })),
            location: location
          } 
        });
      } else if (analysisResult.species) {
        // Legacy format - single species
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
          ].filter(Boolean)
        };
        
        navigate('/analysis-result', { 
          state: { 
            alternatives: [species],
            location: location
          } 
        });
      } else {
        throw new Error('Ingen artidentifiering kunde göras');
      }
    } catch (error) {
      console.error('AI-analys misslyckades:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analys misslyckades", 
        description: error instanceof Error ? error.message : "Kunde inte analysera bilden",
        variant: "destructive"
      });
    }
  };

  if (isAnalyzing) {
    return (
      <AnalyzingScreen 
        category={CATEGORIES.find(c => c.value === selectedCategory)?.label || "fångst"} 
        detailLevel={detailLevel}
        onCancel={() => setIsAnalyzing(false)}
      />
    );
  }

  return (
    <>
      <TopNavigation user={user} onLogout={handleLogout} />
      <PhotoTipsDialog 
        open={tipsDialogOpen} 
        onOpenChange={setTipsDialogOpen}
        category={selectedCategory || undefined}
      />
      
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-16">
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
          {/* Tips Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTipsDialogOpen(true)}
              className="gap-2 bg-card/80 backdrop-blur-sm"
            >
              <HelpCircle className="h-4 w-4" />
              Tips för bättre bilder
            </Button>
          </div>

          {/* Category Selection - Optional */}
          <div className="bg-card/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-border space-y-5">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-2">🔍</div>
              <h3 className="text-xl font-bold text-foreground">Vad försöker du fånga?</h3>
              <p className="text-sm text-muted-foreground">Valfritt: Välj kategori om det är svårt att isolera fångsten på bilden</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  variant="outline"
                  className={`h-20 flex flex-col gap-1 border-2 transition-all ${
                    selectedCategory === cat.value
                      ? "bg-primary/20 border-primary shadow-lg scale-105"
                      : "bg-gradient-to-br from-primary/5 to-accent/5 border-border hover:border-primary hover:bg-primary/10 hover:scale-105 hover:shadow-lg"
                  } active:scale-95`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
                >
                  <span className="text-2xl">{cat.label.split(' ')[0]}</span>
                  <span className="text-xs font-medium">{cat.label.split(' ')[1]}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Detail Level Selection */}
          <div className="bg-card/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-border space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-1">⚙️</div>
              <h3 className="text-lg font-bold text-foreground">Analysnivå</h3>
              <p className="text-xs text-muted-foreground">Välj hur grundlig AI-analysen ska vara</p>
            </div>
            <div className="space-y-3">
              {DETAIL_LEVELS.map((level) => {
                const Icon = level.icon;
                return (
                  <Button
                    key={level.value}
                    variant={detailLevel === level.value ? "default" : "outline"}
                    className={`w-full h-auto p-4 flex items-start gap-3 transition-all hover:scale-105 active:scale-95 ${
                      detailLevel === level.value 
                        ? "bg-gradient-to-r from-primary to-accent border-0 shadow-lg" 
                        : "bg-card border-2 hover:border-primary hover:bg-primary/5"
                    }`}
                    onClick={() => setDetailLevel(level.value)}
                  >
                    <div className={`p-2 rounded-lg ${
                      detailLevel === level.value 
                        ? "bg-white/20" 
                        : "bg-primary/10"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        detailLevel === level.value ? "text-white" : "text-primary"
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${
                          detailLevel === level.value ? "text-white" : "text-foreground"
                        }`}>
                          {level.label}
                        </span>
                        <span className={`text-xs font-semibold ${
                          detailLevel === level.value ? "text-white/80" : "text-muted-foreground"
                        }`}>
                          {level.time}
                        </span>
                      </div>
                      <p className={`text-xs ${
                        detailLevel === level.value ? "text-white/90" : "text-muted-foreground"
                      }`}>
                        {level.description}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selected Category Display (if any) */}
          {selectedCategory && (
            <div className="bg-primary/10 border-2 border-primary/20 rounded-xl p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Vald kategori</p>
                <p className="text-sm font-semibold text-primary">
                  {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <Button 
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            onClick={handleAnalyze}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyserar...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Analysera med AI
              </>
            )}
          </Button>
          
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
        </div>
      </div>
    </div>
    </>
  );
};