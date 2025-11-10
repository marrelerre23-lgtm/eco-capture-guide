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
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
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

      {/* Category Selection Dialog */}
      <dialog 
        open={categoryDialogOpen} 
        className={`fixed inset-0 z-50 ${categoryDialogOpen ? 'flex' : 'hidden'} items-end justify-center`}
        onClick={() => setCategoryDialogOpen(false)}
      >
        <div 
          className="bg-card rounded-t-3xl w-full max-w-2xl p-6 shadow-xl border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Välj kategori</h3>
            <p className="text-sm text-muted-foreground">Valfritt: Hjälper AI:n identifiera fångsten</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant="outline"
                className={`h-20 flex flex-col gap-2 border transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary/20 border-primary shadow-md"
                    : "bg-card border-border hover:border-primary hover:bg-primary/5"
                }`}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.value ? null : cat.value);
                  setCategoryDialogOpen(false);
                }}
              >
                <span className="text-2xl">{cat.label.split(' ')[0]}</span>
                <span className="text-xs font-medium">{cat.label.split(' ')[1]}</span>
              </Button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setCategoryDialogOpen(false)}
          >
            Stäng
          </Button>
        </div>
      </dialog>

      {/* Detail Level Selection Dialog */}
      <dialog 
        open={detailDialogOpen} 
        className={`fixed inset-0 z-50 ${detailDialogOpen ? 'flex' : 'hidden'} items-end justify-center`}
        onClick={() => setDetailDialogOpen(false)}
      >
        <div 
          className="bg-card rounded-t-3xl w-full max-w-2xl p-6 shadow-xl border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Välj analysnivå</h3>
            <p className="text-sm text-muted-foreground">Hur grundlig ska AI-analysen vara?</p>
          </div>
          <div className="space-y-3 mb-4">
            {DETAIL_LEVELS.map((level) => {
              const Icon = level.icon;
              return (
                <Button
                  key={level.value}
                  variant={detailLevel === level.value ? "default" : "outline"}
                  className={`w-full h-auto p-4 flex items-start gap-3 transition-all ${
                    detailLevel === level.value 
                      ? "bg-gradient-to-r from-primary to-accent border-0 shadow-md" 
                      : "bg-card border hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => {
                    setDetailLevel(level.value);
                    setDetailDialogOpen(false);
                  }}
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
                      <span className={`text-base font-bold ${
                        detailLevel === level.value ? "text-white" : "text-foreground"
                      }`}>
                        {level.label}
                      </span>
                      <span className={`text-sm font-semibold ${
                        detailLevel === level.value ? "text-white/80" : "text-muted-foreground"
                      }`}>
                        {level.time}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      detailLevel === level.value ? "text-white/90" : "text-muted-foreground"
                    }`}>
                      {level.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setDetailDialogOpen(false)}
          >
            Stäng
          </Button>
        </div>
      </dialog>
      
      <div className="fixed inset-0 pt-16 pb-0 flex flex-col bg-background">
        {/* Back Button */}
        <div className="absolute top-20 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="bg-card/90 backdrop-blur-sm shadow-md hover:shadow-lg"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Photo Preview - Takes up remaining space */}
        <div className="flex-1 relative px-4 pt-4 overflow-hidden">
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
            <img 
              src={imageUrl} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
            
            {/* Selection Summary Overlaid on Image */}
            <div className="absolute bottom-6 left-4 right-4 bg-transparent border-2 border-primary/30 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Category Section */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-2">Kategori</span>
                  <button
                    onClick={() => setCategoryDialogOpen(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-2xl">
                      {selectedCategory ? CATEGORIES.find(c => c.value === selectedCategory)?.label.split(' ')[0] : '🌿'}
                    </span>
                    <span className="text-base font-semibold text-primary">
                      {selectedCategory ? CATEGORIES.find(c => c.value === selectedCategory)?.label.split(' ')[1] : 'Växt'}
                    </span>
                  </button>
                </div>

                {/* Detail Level Section */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-2">Analysnivå</span>
                  <button
                    onClick={() => setDetailDialogOpen(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {(() => {
                      const level = DETAIL_LEVELS.find(l => l.value === detailLevel);
                      const Icon = level?.icon || Star;
                      return (
                        <>
                          <Icon className="w-5 h-5 text-accent" />
                          <span className="text-base font-semibold text-accent">
                            {level?.label} ({level?.time})
                          </span>
                        </>
                      );
                    })()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="px-4 py-4 bg-background space-y-3">
          {/* Analyze Button */}
          <Button 
            size="lg"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl"
            onClick={handleAnalyze}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Analyserar...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Analysera med AI
              </>
            )}
          </Button>
          
          {/* Bottom Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 rounded-2xl border-2 border-border bg-transparent hover:bg-accent/10 font-medium"
              onClick={() => setCategoryDialogOpen(true)}
              disabled={uploading}
            >
              Ändra kategori
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 rounded-2xl border-2 border-border bg-transparent hover:bg-accent/10 font-medium"
              onClick={onRetake}
              disabled={uploading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Ta om
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};