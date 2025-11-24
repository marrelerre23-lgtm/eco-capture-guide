import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, RotateCcw, Zap, Star, Microscope, HelpCircle, Sparkles, Settings, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadCaptureFromDataUrl } from "@/utils/storage";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { TopNavigation } from "./TopNavigation";
import { PhotoTipsDialog } from "./PhotoTipsDialog";
import { RewardedAdDialog } from "./RewardedAdDialog";
import { User } from "@supabase/supabase-js";
import { Species, MAIN_CATEGORY_DISPLAY, MainCategoryKey } from "@/types/species";
import { getCachedResult, setCachedResult } from "@/utils/imageCache";
import { getCachedAnalysis, setCachedAnalysis } from "@/utils/analysisCache";
import { useSubscription } from "@/hooks/useSubscription";
import { useRateLimit } from "@/hooks/useRateLimit";

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
  uploading?: boolean;
  location?: { latitude: number; longitude: number; accuracy?: number } | null;
}

// Simplified main categories for UI
const SIMPLIFIED_CATEGORIES: Array<{ value: MainCategoryKey; label: string; hint: string }> = [
  { value: "träd-vedartade", label: "🌲 Träd och Vedartade", hint: "Barrträd, lövträd, buskar, klätterväxter" },
  { value: "örter-blommor", label: "🌸 Örter och Blommor", hint: "Blommor, örter och gräs" },
  { value: "mossor-lavar", label: "🍃 Mossor och Lavar", hint: "Mossor och lavar" },
  { value: "svampar", label: "🍄 Svampar", hint: "Alla typer av svampar" },
  { value: "fåglar", label: "🦅 Fåglar", hint: "Alla typer av fåglar" },
  { value: "däggdjur", label: "🦌 Däggdjur", hint: "Däggdjur och större djur" },
  { value: "grod-kräldjur", label: "🐸 Grod- och Kräldjur", hint: "Grodor, salamandrar, ödlor, ormar" },
  { value: "insekter-spindeldjur", label: "🦋 Insekter och Spindeldjur", hint: "Insekter och spindlar" },
  { value: "vatten-ryggradslöst", label: "🐚 Vatten- och Ryggradslöst", hint: "Vattenlevande och ryggradslösa djur" },
  { value: "stenar-mineraler", label: "💎 Stenar & Mineraler", hint: "Stenar, mineraler och bergarter" },
  { value: "spår-övrigt", label: "👣 Spår och Övrigt", hint: "Spår, fotavtryck och annat" },
] as const;

// #17: Map main categories to PhotoTipsDialog categories
const getCategoryForTips = (mainCategory: MainCategoryKey): string => {
  const mapping: Record<MainCategoryKey, string> = {
    "svampar": "mushroom",
    "örter-blommor": "plant",
    "träd-vedartade": "tree",
    "mossor-lavar": "moss",
    "stenar-mineraler": "stone",
    "fåglar": "bird",
    "däggdjur": "mammal",
    "grod-kräldjur": "amphibian",
    "insekter-spindeldjur": "insect",
    "vatten-ryggradslöst": "aquatic",
    "spår-övrigt": "tracks"
  };
  return mapping[mainCategory] || "general";
};

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
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryKey | null>(null);
  const [detailLevel, setDetailLevel] = useState<string>("standard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tipsDialogOpen, setTipsDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showRewardedAdDialog, setShowRewardedAdDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { subscription, checkCanAnalyze, refetch } = useSubscription();
  
  // Rate limiting for AI analysis
  const { checkLimit: checkRateLimit } = useRateLimit('ai-analysis', {
    maxAttempts: 1,
    windowMs: 2000, // 2 seconds
    message: 'Vänta lite innan nästa analys för att undvika överbelastning.'
  });

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
      // Check subscription limits first
      const canAnalyze = await checkCanAnalyze();
      if (!canAnalyze) {
        // If limit reached and user is free tier, show rewarded ad dialog
        if (subscription?.tier === 'free' && subscription?.isAnalysisLimitReached) {
          setShowRewardedAdDialog(true);
        }
        return;
      }

      // Rate limiting check using hook
      if (checkRateLimit()) {
        return; // Hook will show toast
      }

      // Mark that user has performed an analysis (for PWA prompt timing)
      localStorage.setItem('has_analyzed', 'true');

      // Check analysis cache (5 min TTL) to prevent accidental duplicates
      const cachedAnalysis = await getCachedAnalysis(imageUrl);
      if (cachedAnalysis) {
        console.log('Using cached analysis (within 5 min window)');
        navigate('/analysis-result', { 
          state: cachedAnalysis
        });
        return;
      }

      setIsAnalyzing(true);
      console.log('Laddar upp bild till Supabase...');
      
      // First upload the image to Supabase Storage
      const uploadedImageUrl = await uploadCaptureFromDataUrl(imageUrl);
      console.log('Bild uppladdad:', uploadedImageUrl);
      
      console.log('Startar AI-analys av bild...');
      
      // Call the Supabase Edge Function
      // Pass selected main category (växter, insekter, etc.) or null for auto-detect
      // Edge function will handle mapping to appropriate subcategories
      const { data, error } = await supabase.functions.invoke('analyze-species', {
        body: { 
          imageUrl: uploadedImageUrl,
          category: selectedCategory || null, // Pass main category or null for auto-detect
          detailLevel: detailLevel
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        const errorMsg = error.message || 'Edge Function returnerade ett fel';
        
        // Check if upgrade is required (429 or upgradeRequired flag)
        if (error.message?.includes('429') || data?.upgradeRequired) {
          toast({
            title: "Gräns nådd",
            description: data?.error || "Du har nått din analysgräns. Uppgradera till Premium för obegränsade analyser!",
            variant: "destructive",
            duration: 5000,
          });
          setIsAnalyzing(false);
          return;
        }
        
        throw new Error(`Analys misslyckades: ${errorMsg}`);
      }

      if (!data) {
        console.error('Inget data från edge function');
        throw new Error('Inget svar från AI-analysen');
      }

      if (data.error) {
        console.error('AI analysis error:', data.error);
        // Check if upgrade is required
        if (data.upgradeRequired) {
          toast({
            title: "Gräns nådd",
            description: data.error,
            variant: "destructive",
            duration: 5000,
          });
          setIsAnalyzing(false);
          return;
        }
        throw new Error(`AI-fel: ${data.error}`);
      }

      const analysisResult = data;
      console.log('Analys resultat:', analysisResult);

      // Check if we have alternatives (new format) or single species (old format)
      if (analysisResult.alternatives && Array.isArray(analysisResult.alternatives)) {
        const resultState = { 
          alternatives: analysisResult.alternatives.map((alt: any) => ({
            id: crypto.randomUUID(),
            name: alt.species.commonName || "Okänd art",
            scientificName: alt.species.scientificName || "Okänd",
            image: uploadedImageUrl,
            dateFound: new Date(),
            description: alt.species.description || "Ingen beskrivning tillgänglig",
            category: alt.species.category || "annat",
            confidence: alt.species.confidence || 0.5,
            reasoning: alt.reasoning || "",
            facts: [
              alt.species.habitat ? `Habitat: ${alt.species.habitat}` : "",
              alt.species.identificationFeatures ? `Kännetecken: ${alt.species.identificationFeatures}` : "",
              alt.species.rarity ? `Sällsynthet: ${alt.species.rarity}` : "",
              alt.species.sizeInfo ? `Storlek: ${alt.species.sizeInfo}` : "",
              alt.species.confidence ? `AI-säkerhet: ${Math.round(alt.species.confidence * 100)}%` : ""
            ].filter(Boolean)
          })),
          location: location
        };

        // Cache the result with 5-minute TTL
        await setCachedAnalysis(imageUrl, resultState);
        console.log('Analysis result cached with 5-min TTL');

        // Navigate to analysis result page with all alternatives
        navigate('/analysis-result', { state: resultState });
      } else if (analysisResult.species) {
        // Legacy format - single species
        const species: Species = {
          id: crypto.randomUUID(),
          name: analysisResult.species.commonName || "Okänd art",
          scientificName: analysisResult.species.scientificName || "Okänd",
          image: uploadedImageUrl,
          dateFound: new Date(),
          description: analysisResult.species.description || "Ingen beskrivning tillgänglig",
          category: analysisResult.species.category || "annat",
          facts: [
            analysisResult.species.habitat ? `Habitat: ${analysisResult.species.habitat}` : "",
            analysisResult.species.identificationFeatures ? `Kännetecken: ${analysisResult.species.identificationFeatures}` : "",
            analysisResult.species.rarity ? `Sällsynthet: ${analysisResult.species.rarity}` : "",
            analysisResult.species.sizeInfo ? `Storlek: ${analysisResult.species.sizeInfo}` : "",
            analysisResult.species.confidence ? `AI-säkerhet: ${Math.round(analysisResult.species.confidence * 100)}%` : ""
          ].filter(Boolean)
        };

        const resultState = { 
          alternatives: [species],
          location: location
        };

        // Cache the result with 5-minute TTL
        await setCachedAnalysis(imageUrl, resultState);
        console.log('Analysis result cached with 5-min TTL');
        
        navigate('/analysis-result', { state: resultState });
      } else {
        throw new Error('Ingen artidentifiering kunde göras');
      }
    } catch (error) {
      console.error('AI-analys misslyckades:', error);
      setIsAnalyzing(false);
      
      const errorMessage = error instanceof Error ? error.message : "Kunde inte analysera bilden";
      
      toast({
        title: "Analys misslyckades", 
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (isAnalyzing) {
    return (
      <AnalyzingScreen 
        category={selectedCategory ? MAIN_CATEGORY_DISPLAY[selectedCategory].name : "fångst"} 
        detailLevel={detailLevel}
        onCancel={() => setIsAnalyzing(false)}
        isFreeUser={subscription?.tier === 'free'}
      />
    );
  }

  return (
    <>
      <TopNavigation user={user} onLogout={handleLogout} />
      <PhotoTipsDialog 
        open={tipsDialogOpen} 
        onOpenChange={setTipsDialogOpen}
        category={selectedCategory ? getCategoryForTips(selectedCategory) : undefined}
      />
      
      <RewardedAdDialog 
        open={showRewardedAdDialog}
        onOpenChange={setShowRewardedAdDialog}
        type="analysis"
        onRewardClaimed={() => {
          refetch();
          toast({
            title: "Belöning mottagen!",
            description: "Du kan nu göra 5 extra analyser idag. Analysera din bild!",
          });
        }}
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
            <h3 className="text-lg font-semibold text-foreground">Välj kategori-tips till AI:n</h3>
            <p className="text-sm text-muted-foreground">Detta hjälper AI:n att fokusera analysen och ge snabbare resultat</p>
          </div>
          <div className="space-y-2">
            {SIMPLIFIED_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setCategoryDialogOpen(false);
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedCategory === cat.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium">{cat.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{cat.hint}</div>
              </button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4"
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
      
      <div className="fixed inset-0 pt-14 pb-0 flex flex-col bg-background">
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
        <div className="flex-1 relative px-3 pt-2 overflow-hidden">
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
            <img 
              src={imageUrl} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
            
            {/* Category tip hint */}
            {selectedCategory && (
              <div className="absolute top-4 left-3 right-3 bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-lg">{MAIN_CATEGORY_DISPLAY[selectedCategory].icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-white/70">AI:n fokuserar på:</p>
                    <p className="text-sm font-semibold">{MAIN_CATEGORY_DISPLAY[selectedCategory].name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="px-3 py-3 bg-background space-y-3">
          {/* Primary: Analyze directly */}
          <Button 
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
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
                <Sparkles className="mr-2 h-5 w-5" />
                Analysera direkt
              </>
            )}
          </Button>

          {/* Secondary: Advanced options toggle */}
          {!showAdvancedOptions && (
            <Button
              onClick={() => setShowAdvancedOptions(true)}
              variant="outline"
              size="sm"
              className="w-full bg-background/95 backdrop-blur-sm"
              disabled={uploading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Ge AI:n ett tips om kategori
            </Button>
          )}

          {/* Advanced options */}
          {showAdvancedOptions && (
            <div className="space-y-2 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Avancerade alternativ</span>
                <Button
                  onClick={() => setShowAdvancedOptions(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Subscription Status */}
              {subscription && subscription.tier === 'free' && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Din plan</span>
                    <Badge variant="secondary" className="text-xs">Gratis</Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analyser idag:</span>
                      <span className={subscription.isAnalysisLimitReached ? 'text-destructive font-medium' : ''}>
                        {subscription.analysesToday} / {subscription.maxAnalysesPerDay}
                      </span>
                    </div>
                  </div>
                  {subscription.isAnalysisLimitReached && (
                    <p className="text-xs text-destructive mt-1">
                      Gräns nådd. Återställs vid midnatt.
                    </p>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setCategoryDialogOpen(true)}
                className="w-full bg-background border border-border rounded-lg p-3 flex items-center justify-between hover:bg-accent transition-colors"
                disabled={uploading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    {selectedCategory ? MAIN_CATEGORY_DISPLAY[selectedCategory].icon : "❓"}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Kategori-tips</div>
                    <div className="font-medium text-sm">
                      {selectedCategory ? MAIN_CATEGORY_DISPLAY[selectedCategory].name : "Välj kategori"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setDetailDialogOpen(true)}
                className="w-full bg-background border border-border rounded-lg p-3 flex items-center justify-between hover:bg-accent transition-colors"
                disabled={uploading}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    {(() => {
                      const level = DETAIL_LEVELS.find(l => l.value === detailLevel);
                      const Icon = level?.icon || Star;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Detaljnivå</div>
                    <div className="font-medium text-sm">
                      {DETAIL_LEVELS.find(l => l.value === detailLevel)?.label}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          
          {/* Retake button */}
          <Button 
            variant="outline" 
            size="lg"
            className="w-full h-12 rounded-2xl border-2 border-border bg-transparent hover:bg-accent/10 font-medium"
            onClick={onRetake}
            disabled={uploading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Ta om bilden
          </Button>
        </div>
      </div>
    </>
  );
};