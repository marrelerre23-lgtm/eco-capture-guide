import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: Date;
  description: string;
  facts: string[];
}

const AnalysisResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  // Get species data from navigation state
  const species = location.state?.species as Species;

  React.useEffect(() => {
    // Redirect to camera if no species data
    if (!species) {
      navigate('/camera');
    }
  }, [species, navigate]);

  if (!species) return null;

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
      species.facts.forEach(fact => {
        const [key, ...valueParts] = fact.split(': ');
        if (valueParts.length > 0) {
          factsMap[key] = valueParts.join(': ');
        }
      });

      // Extract category from facts first, then fallback to description
      let category = factsMap['Kategori']?.toLowerCase() || "växt";
      if (!factsMap['Kategori']) {
        const description = species.description.toLowerCase();
        if (description.includes('svamp')) category = "svamp";
        else if (description.includes('träd') || description.includes('buske')) category = "träd";
        else if (description.includes('mossa') || description.includes('lav')) category = "mossa";
        else if (description.includes('sten') || description.includes('mineral')) category = "sten";
      }

      // Parse confidence from facts if available
      let confidence = 0.85; // default
      const confidenceFact = species.facts.find(f => f.startsWith('AI-säkerhet:'));
      if (confidenceFact) {
        const match = confidenceFact.match(/(\d+)%/);
        if (match) {
          confidence = parseInt(match[1]) / 100;
        }
      }

      // Save to species_captures table with complete structure
      const { error } = await supabase
        .from('species_captures')
        .insert({
          user_id: user.id,
          image_url: species.image,
          captured_at: species.dateFound.toISOString(),
          ai_analysis: {
            species: {
              commonName: species.name,
              scientificName: species.scientificName,
              category: category,
              confidence: confidence,
              description: species.description,
              habitat: factsMap['Habitat'] || undefined,
              identificationFeatures: factsMap['Kännetecken'] || undefined,
              rarity: factsMap['Sällsynthet'] || undefined,
              sizeInfo: factsMap['Storlek'] || undefined,
            }
          },
          notes: `AI-identifierad som ${species.name} (${species.scientificName})`
        });

      if (error) throw error;

      toast({
        title: "Fångst sparad!",
        description: `${species.name} har lagts till i din loggbok`
      });

      navigate('/logbook');
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
    navigate('/camera');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Analysresultat</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {/* Image */}
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          <img 
            src={species.image}
            alt={species.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Species Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary">{species.name}</h2>
            <p className="text-lg italic text-muted-foreground">{species.scientificName}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Beskrivning</h3>
            <p className="text-muted-foreground leading-relaxed">{species.description}</p>
          </div>

          {species.facts && species.facts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Fakta</h3>
              <div className="space-y-2">
                {species.facts.map((fact, index) => (
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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
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