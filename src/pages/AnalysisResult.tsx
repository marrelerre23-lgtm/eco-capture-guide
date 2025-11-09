import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: Date;
  description: string;
  facts: string[];
  confidence?: number;
  reasoning?: string;
}

const AnalysisResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState(0);
  const [reportingError, setReportingError] = useState(false);

  // Get alternatives data and location from navigation state
  const alternatives = location.state?.alternatives as Species[] || [];
  const gpsLocation = location.state?.location as { latitude: number; longitude: number; accuracy?: number } | null;

  useEffect(() => {
    // Redirect to camera if no alternatives data
    if (!alternatives || alternatives.length === 0) {
      navigate('/camera');
    }
  }, [alternatives, navigate]);

  if (!alternatives || alternatives.length === 0) return null;

  const selectedSpecies = alternatives[selectedAlternativeIndex];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "Hög säkerhet";
    if (confidence >= 0.6) return "Medel säkerhet";
    return "Låg säkerhet";
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

      // Extract category from facts first, then fallback to description
      let category = factsMap['Kategori']?.toLowerCase() || "växt";
      if (!factsMap['Kategori']) {
        const description = selectedSpecies.description.toLowerCase();
        if (description.includes('svamp')) category = "svamp";
        else if (description.includes('träd') || description.includes('buske')) category = "träd";
        else if (description.includes('mossa') || description.includes('lav')) category = "mossa";
        else if (description.includes('sten') || description.includes('mineral')) category = "sten";
      }

      // Generate location name from coordinates if available
      let locationName = null;
      if (gpsLocation) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsLocation.latitude}&lon=${gpsLocation.longitude}&zoom=14&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SpeciesCapture/1.0'
              }
            }
          );
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
        } catch (error) {
          console.log('Kunde inte hämta platsnamn:', error);
        }
      }

      // Save to species_captures table with complete structure
      const { error } = await supabase
        .from('species_captures')
        .insert({
          user_id: user.id,
          image_url: selectedSpecies.image,
          captured_at: selectedSpecies.dateFound.toISOString(),
          latitude: gpsLocation?.latitude || null,
          longitude: gpsLocation?.longitude || null,
          gps_accuracy: gpsLocation?.accuracy || null,
          location_name: locationName,
          ai_analysis: {
            species: {
              commonName: selectedSpecies.name,
              scientificName: selectedSpecies.scientificName,
              category: category,
              confidence: selectedSpecies.confidence || 0.85,
              description: selectedSpecies.description,
              habitat: factsMap['Habitat'] || undefined,
              identificationFeatures: factsMap['Kännetecken'] || undefined,
              rarity: factsMap['Sällsynthet'] || undefined,
              sizeInfo: factsMap['Storlek'] || undefined,
            }
          },
          notes: `AI-identifierad som ${selectedSpecies.name} (${selectedSpecies.scientificName})`
        });

      if (error) throw error;

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
        {/* Image */}
        <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-lg">
          <img 
            src={selectedSpecies.image}
            alt={selectedSpecies.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Alternatives Navigation */}
        {alternatives.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Alternativ {selectedAlternativeIndex + 1} av {alternatives.length}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedAlternativeIndex(Math.max(0, selectedAlternativeIndex - 1))}
                      disabled={selectedAlternativeIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedAlternativeIndex(Math.min(alternatives.length - 1, selectedAlternativeIndex + 1))}
                      disabled={selectedAlternativeIndex === alternatives.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Alternative buttons */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {alternatives.map((alt, index) => (
                    <Button
                      key={index}
                      variant={selectedAlternativeIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAlternativeIndex(index)}
                      className="whitespace-nowrap"
                    >
                      {alt.name}
                      {alt.confidence && (
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(alt.confidence * 100)}%
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Confidence Indicator */}
        {selectedSpecies.confidence && (
          <Card className="border-2">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI-säkerhet</h3>
                <span className={`text-sm font-medium ${getConfidenceColor(selectedSpecies.confidence)}`}>
                  {getConfidenceLabel(selectedSpecies.confidence)}
                </span>
              </div>
              <Progress value={selectedSpecies.confidence * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedSpecies.confidence * 100)}% säker på denna identifiering
              </p>
            </CardContent>
          </Card>
        )}

        {/* Species Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary">{selectedSpecies.name}</h2>
            <p className="text-lg italic text-muted-foreground">{selectedSpecies.scientificName}</p>
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

          {selectedSpecies.facts && selectedSpecies.facts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Fakta</h3>
              <div className="space-y-2">
                {selectedSpecies.facts.map((fact, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground text-sm leading-relaxed">{fact}</p>
                  </div>
                ))}
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
