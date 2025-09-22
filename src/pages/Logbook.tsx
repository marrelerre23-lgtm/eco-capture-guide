import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";
import { SpeciesModal } from "@/components/SpeciesModal";
import { useSpeciesCaptures, type ParsedSpeciesCapture } from "@/hooks/useSpeciesCaptures";
import { Button } from "@/components/ui/button";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: string;
  description: string;
  category: string;
  confidence?: number;
  facts: {
    icon: string;
    title: string;
    description: string;
  }[];
}

// Helper function to convert SpeciesCapture to Species format
const convertCaptureToSpecies = (capture: ParsedSpeciesCapture): Species => {
  const species = capture.ai_analysis?.species;
  const capturedDate = new Date(capture.captured_at);
  
  return {
    id: capture.id,
    name: species?.commonName || "Okänd art",
    scientificName: species?.scientificName || "Okänd",
    image: capture.image_url,
    dateFound: `Fångad ${capturedDate.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}, kl. ${capturedDate.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`,
    description: species?.description || "Ingen beskrivning tillgänglig",
    category: species?.category || "okänd",
    confidence: species?.confidence,
    facts: [
      ...(species?.habitat ? [{
        icon: "🏞️",
        title: "Habitat",
        description: species.habitat
      }] : []),
      ...(species?.identificationFeatures ? [{
        icon: "🔍",
        title: "Kännetecken",
        description: species.identificationFeatures
      }] : []),
      ...(species?.rarity ? [{
        icon: "⭐",
        title: "Sällsynthet",
        description: species.rarity
      }] : []),
      ...(species?.sizeInfo ? [{
        icon: "📏",
        title: "Storlek",
        description: species.sizeInfo
      }] : []),
      ...(species?.confidence ? [{
        icon: "🤖",
        title: "AI-säkerhet",
        description: `${Math.round(species.confidence * 100)}% säker på identifieringen`
      }] : []),
      ...(capture.location_name ? [{
        icon: "📍",
        title: "Plats",
        description: capture.location_name
      }] : [])
    ]
  };
};

// Helper function to get category icon
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'växt': '🌿',
    'svamp': '🍄',
    'träd': '🌳',
    'insekt': '🦋',
    'fågel': '🦅',
    'blomma': '🌸',
    'buske': '🌱'
  };
  return icons[category.toLowerCase()] || '🔍';
};

const Logbook = () => {
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();

  // Group captures by category
  const categorizedSpecies = useMemo(() => {
    if (!captures) return [];

    const grouped = captures.reduce((acc, capture) => {
      const species = convertCaptureToSpecies(capture);
      const category = species.category;
      
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(species);
      return acc;
    }, {} as Record<string, Species[]>);

    return Object.entries(grouped).map(([name, species]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: species.length,
      icon: getCategoryIcon(name),
      species
    }));
  }, [captures]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? "" : categoryName);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Laddar dina fångster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <div className="space-y-2">
            <p className="font-medium">Kunde inte ladda fångster</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Ett okänt fel uppstod"}
            </p>
          </div>
          <Button onClick={() => refetch()}>Försök igen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Min Loggbok</h1>
          <p className="text-muted-foreground">
            En översikt av alla dina upptäckter. Klicka på en bild för detaljer.
          </p>
        </div>

        {/* Categories */}
        {categorizedSpecies.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl">📸</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Inga fångster än</h3>
              <p className="text-muted-foreground">
                Använd kameran för att ta din första bild och identifiera arter!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {categorizedSpecies.map((category) => (
            <div key={category.name}>
              {/* Category Header */}
              <Card 
                className="cursor-pointer shadow-card hover:shadow-eco transition-shadow"
                onClick={() => toggleCategory(category.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {category.count}
                      </Badge>
                      {expandedCategory === category.name ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Species Grid */}
              {expandedCategory === category.name && category.species.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {category.species.map((species) => (
                    <Card 
                      key={species.id}
                      className="cursor-pointer shadow-card hover:shadow-eco transition-all overflow-hidden"
                      onClick={() => setSelectedSpecies(species)}
                    >
                      <div className="aspect-square relative">
                        <img 
                          src={species.image}
                          alt={species.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <h4 className="text-white font-medium text-sm">{species.name}</h4>
                          <p className="text-white/80 text-xs italic">{species.scientificName}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Species Modal */}
      {selectedSpecies && (
        <SpeciesModal
          species={selectedSpecies}
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      )}
    </div>
  );
};

export default Logbook;