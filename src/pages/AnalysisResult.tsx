import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2, AlertTriangle, ZoomIn, MapPin, Leaf, Mountain, Droplet, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AIPhotoTips } from "@/components/AIPhotoTips";
import { Species, getMainCategory, getCategoryDisplayName, MAIN_CATEGORY_DISPLAY } from "@/types/species";
import { formatGpsAccuracy, getGpsAccuracyIcon } from "@/utils/formatGpsAccuracy";
import { getGpsGuidanceMessage, getGpsAccuracyColorClass } from "@/utils/gpsGuidance";
import { useSubscription } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { AnalysisResultSkeleton } from "@/components/LoadingSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AnalysisResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState(0);
  const [reportingError, setReportingError] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const { checkCanCapture } = useSubscription();

  // Get alternatives data and location from navigation state
  const alternatives = location.state?.alternatives as Species[] || [];
  const gpsLocation = location.state?.location as { latitude: number; longitude: number; accuracy?: number } | null;

  // #21: Show skeleton while checking for alternatives
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Small delay to show skeleton, then check for alternatives
    const timer = setTimeout(() => {
      setIsInitializing(false);
      if (!alternatives || alternatives.length === 0) {
        navigate('/camera');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [alternatives, navigate]);

  if (isInitializing) {
    return <AnalysisResultSkeleton />;
  }

  if (!alternatives || alternatives.length === 0) return null;

  const selectedSpecies = alternatives[selectedAlternativeIndex];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceEmoji = (confidence: number) => {
    if (confidence >= 0.8) return "✅";
    if (confidence >= 0.6) return "⚠️";
    return "❓";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "Hög säkerhet";
    if (confidence >= 0.6) return "Medel säkerhet";
    return "Låg säkerhet";
  };

  const getFactIcon = (fact: string) => {
    if (fact.toLowerCase().includes('habitat')) return MapPin;
    if (fact.toLowerCase().includes('storlek')) return Mountain;
    if (fact.toLowerCase().includes('sällsynthet')) return Leaf;
    return Sun;
  };

  const handleReportError = async () => {
    setReportingError(true);
    try {
      // In a real app, this would send feedback to improve the AI
      // For now, we'll just show a toast
      toast({
        title: "Tack för din feedback!",
        description: "Vi kommer använda denna information för att förbättra AI-modellen.",
      });
    } catch (error) {
      toast({
        title: "Kunde inte skicka feedback",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setReportingError(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Inloggning krävs",
          description: "Du måste vara inloggad för att spara fångster",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Check capture limits
      const canCapture = await checkCanCapture();
      if (!canCapture) {
        setSaving(false);
        return;
      }

      // Extract data from species.facts array to rebuild proper structure
      const factsMap: Record<string, string> = {};
      selectedSpecies.facts.forEach(fact => {
        const [key, ...valueParts] = fact.split(': ');
        if (valueParts.length > 0) {
          factsMap[key] = valueParts.join(': ');
        }
      });

      // Use category directly from selectedSpecies
      const category = selectedSpecies.category || "annat";

      // Generate location name from coordinates if available
      let locationName = null;
      if (gpsLocation) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsLocation.latitude}&lon=${gpsLocation.longitude}&zoom=14&addressdetails=1`,
            {
              signal: controller.signal,
              headers: {
                'User-Agent': 'SpeciesCapture/1.0'
              }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.address) {
              const parts = [];
              if (data.address.village || data.address.town || data.address.city) {
                parts.push(data.address.village || data.address.town || data.address.city);
              }
              if (data.address.municipality && parts[0] !== data.address.municipality) {
                parts.push(data.address.municipality);
              }
              locationName = parts.join(', ') || data.display_name;
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Geocoding timeout, using coordinates');
          } else {
            console.log('Geocoding error:', error);
          }
          // Fallback to coordinates if geocoding fails or times out
          locationName = `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}`;
        }
      }

      // Save to species_captures table with complete structure
      const { error } = await supabase
        .from('species_captures')
        .insert({
          user_id: user.id,
          image_url: selectedSpecies.image,
          captured_at: selectedSpecies.dateFound instanceof Date 
            ? selectedSpecies.dateFound.toISOString() 
            : new Date(selectedSpecies.dateFound).toISOString(), // Always convert to ISO string
          latitude: gpsLocation?.latitude || null,
          longitude: gpsLocation?.longitude || null,
          gps_accuracy: gpsLocation?.accuracy || null,
          location_name: locationName,
          edibility: selectedSpecies.edibility || null,
          age_stage: selectedSpecies.ageStage || null,
          ai_analysis: {
            species: {
              commonName: selectedSpecies.name,
              scientificName: selectedSpecies.scientificName,
              category: category,
              confidence: selectedSpecies.confidence || 0.5, // Default to 0.5 if undefined
              description: selectedSpecies.description,
              habitat: factsMap['Habitat'] || undefined,
              identificationFeatures: factsMap['Kännetecken'] || undefined,
              rarity: factsMap['Sällsynthet'] || undefined,
              sizeInfo: factsMap['Storlek'] || undefined,
              edibility: selectedSpecies.edibility || undefined,
              ageStage: selectedSpecies.ageStage || undefined,
            }
          },
          notes: `AI-identifierad som ${selectedSpecies.name} (${selectedSpecies.scientificName})`
        });

      if (error) throw error;

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['species-captures'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });

      toast({
        title: "Fångst sparad!",
        description: `${selectedSpecies.name} har lagts till i din loggbok`
      });

      // Navigate to logbook and replace history to prevent going back to analysis
      navigate('/logbook', { replace: true });
    } catch (error) {
      console.error('Fel vid sparande av fångst:', error);
      toast({
        title: "Kunde inte spara fångsten",
        description: error instanceof Error ? error.message : "Okänt fel",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    navigate('/camera', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Analysresultat</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={reportingError}>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rapportera fel identifiering</AlertDialogTitle>
                <AlertDialogDescription>
                  Tror du att AI:n har identifierat fel art? Din feedback hjälper oss förbättra systemet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleReportError}>
                  Rapportera fel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-32">
        {/* Image with Zoom */}
        <div className="relative rounded-2xl overflow-hidden bg-muted shadow-2xl group">
          <div className="flex items-center justify-center max-h-[60vh] bg-black/5">
            <img 
              src={selectedSpecies.image}
              alt={selectedSpecies.name}
              className={`w-full h-auto object-contain transition-transform duration-300 ${
                imageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setImageZoomed(!imageZoomed)}
            />
          </div>
          <button 
            onClick={() => setImageZoomed(!imageZoomed)}
            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Alternatives Navigation */}
        {alternatives.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">
              Alternativa identifieringar ({alternatives.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {alternatives.map((alt, index) => (
                <Card
                  key={index}
                  className={`flex-shrink-0 w-48 cursor-pointer snap-start transition-all hover:scale-105 ${
                    selectedAlternativeIndex === index 
                      ? 'ring-2 ring-primary shadow-xl bg-primary/5' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedAlternativeIndex(index)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold line-clamp-2 ${
                        selectedAlternativeIndex === index ? 'text-primary' : ''
                      }`}>
                        {alt.name}
                      </h4>
                      {alt.confidence && (
                        <span className={`text-lg flex-shrink-0 ${
                          selectedAlternativeIndex === index ? 'animate-bounce' : ''
                        }`}>
                          {getConfidenceEmoji(alt.confidence)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground italic line-clamp-1">
                      {alt.scientificName}
                    </p>
                    {alt.confidence && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Säkerhet</span>
                          <span className={`font-semibold ${getConfidenceColor(alt.confidence)}`}>
                            {Math.round(alt.confidence * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all rounded-full ${
                              alt.confidence >= 0.8 ? 'bg-success' : 
                              alt.confidence >= 0.6 ? 'bg-warning' : 
                              'bg-destructive'
                            }`}
                            style={{ width: `${alt.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* AI Confidence Indicator - Circular */}
        {selectedSpecies.confidence && (
          <>
            {/* #14: Low confidence warning */}
            {selectedSpecies.confidence < 0.5 && (
              <Card className="border-2 border-warning bg-warning/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-warning">Mycket osäker identifiering</h4>
                      <p className="text-sm text-muted-foreground">
                        AI:n är mindre än 50% säker på denna identifiering. Överväg att ta en bättre bild med tydligare detaljer, bättre ljus, eller från en annan vinkel för att få mer tillförlitliga resultat.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Circular Progress */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - selectedSpecies.confidence)}`}
                        className={`transition-all duration-1000 ${
                          selectedSpecies.confidence >= 0.8 ? 'text-success' :
                          selectedSpecies.confidence >= 0.6 ? 'text-warning' :
                          'text-destructive'
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">
                        {getConfidenceEmoji(selectedSpecies.confidence)}
                      </span>
                    </div>
                  </div>

                  {/* Text Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">AI-säkerhet</h3>
                    <p className={`text-2xl font-bold mb-1 ${getConfidenceColor(selectedSpecies.confidence)}`}>
                      {Math.round(selectedSpecies.confidence * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getConfidenceLabel(selectedSpecies.confidence)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Species Info */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">{selectedSpecies.name}</h2>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {Math.round((selectedSpecies.confidence || 0) * 100)}% säker
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground italic">
              {selectedSpecies.scientificName}
            </p>
            
            {/* Category Display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-2xl">
                {MAIN_CATEGORY_DISPLAY[getMainCategory(selectedSpecies.category)].icon}
              </span>
              <span className="font-medium">
                {MAIN_CATEGORY_DISPLAY[getMainCategory(selectedSpecies.category)].name}
              </span>
              {/* Show detailed category if it has subcategories */}
              {MAIN_CATEGORY_DISPLAY[getMainCategory(selectedSpecies.category)].subcategories.length > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {getCategoryDisplayName(selectedSpecies.category)}
                  </span>
                </>
              )}
            </div>

            {/* Edibility Badge (for mushrooms and plants) */}
            {selectedSpecies.edibility && selectedSpecies.edibility !== 'okänd' && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    selectedSpecies.edibility === 'giftig' ? 'destructive' :
                    selectedSpecies.edibility === 'ätlig' ? 'default' :
                    'secondary'
                  }
                  className={`text-sm ${
                    selectedSpecies.edibility === 'giftig' ? 'bg-red-500' :
                    selectedSpecies.edibility === 'ätlig' ? 'bg-green-500' :
                    'bg-yellow-500'
                  }`}
                >
                  {selectedSpecies.edibility === 'giftig' && '⚠️ '}
                  {selectedSpecies.edibility === 'ätlig' && '✓ '}
                  {selectedSpecies.edibility}
                </Badge>
                {selectedSpecies.edibility === 'giftig' && (
                  <span className="text-xs text-destructive font-semibold">
                    Rör ej! Potentiellt farlig.
                  </span>
                )}
              </div>
            )}

            {/* Age/Stage Badge */}
            {selectedSpecies.ageStage && (
              <Badge variant="outline" className="text-sm w-fit">
                {selectedSpecies.ageStage}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Beskrivning</h3>
            <p className="text-muted-foreground leading-relaxed">{selectedSpecies.description}</p>
          </div>

          {selectedSpecies.reasoning && (
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold">AI:s resonemang</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedSpecies.reasoning}</p>
            </div>
          )}

          {/* AI Photo Tips */}
          {selectedSpecies.confidence && (
            <AIPhotoTips 
              category={selectedSpecies.category}
              confidence={selectedSpecies.confidence}
            />
          )}

          {/* GPS Accuracy with Guidance and Warning */}
          {gpsLocation?.accuracy !== undefined && (
            <Card className={`border-2 ${
              gpsLocation.accuracy > 50 
                ? 'border-warning/50 bg-warning/5' 
                : getGpsAccuracyColorClass(getGpsGuidanceMessage(gpsLocation.accuracy).level)
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {gpsLocation.accuracy > 50 ? '⚠️' : getGpsGuidanceMessage(gpsLocation.accuracy).icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">GPS-noggrannhet</h4>
                      <Badge variant="outline" className="text-xs">
                        {formatGpsAccuracy(gpsLocation.accuracy)}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      {getGpsGuidanceMessage(gpsLocation.accuracy).message}
                    </p>
                    
                    {/* Warning for poor GPS accuracy */}
                    {gpsLocation.accuracy > 50 && (
                      <div className="mt-2 pt-2 border-t border-warning/20">
                        <p className="text-xs font-semibold text-warning mb-1">
                          ⚠️ Dålig GPS-noggrannhet - Platsen kan vara oprecis
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-0.5 ml-4 list-disc">
                          <li>Gå utomhus för bättre satellitmottagning</li>
                          <li>Vänta några sekunder för bättre signal</li>
                          <li>Undvik täta skogar eller höga byggnader</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSpecies.facts && selectedSpecies.facts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Fakta & Detaljer</h3>
              <div className="grid gap-3">
                {selectedSpecies.facts.map((fact, index) => {
                  const Icon = getFactIcon(fact);
                  return (
                    <Card key={index} className="bg-gradient-to-br from-card to-card/50 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-sm leading-relaxed flex-1 pt-1">{fact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDiscard}
            className="flex-1"
            disabled={saving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Radera
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Spara fångst
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
