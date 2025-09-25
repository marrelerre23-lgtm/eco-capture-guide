import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, AlertCircle, Filter, SortAsc } from "lucide-react";
import { SpeciesModal } from "@/components/SpeciesModal";
import { useSpeciesCaptures, type ParsedSpeciesCapture } from "@/hooks/useSpeciesCaptures";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Predefined categories that always show
const PREDEFINED_CATEGORIES = [
  { name: "Växter och blommor", icon: "🌸", key: "växt" },
  { name: "Träd och buskar", icon: "🌳", key: "träd" },
  { name: "Svampar", icon: "🍄", key: "svamp" },
  { name: "Mossa och lavar", icon: "🌿", key: "mossa" },
  { name: "Stenar och mineraler", icon: "💎", key: "sten" }
];

// Helper function to map AI category to predefined category
const mapToCategory = (aiCategory: string): string => {
  const normalized = aiCategory.toLowerCase();
  if (normalized.includes('växt') || normalized.includes('blomma') || normalized.includes('blom')) return "växt";
  if (normalized.includes('träd') || normalized.includes('buske') || normalized.includes('bush')) return "träd";
  if (normalized.includes('svamp') || normalized.includes('mushroom')) return "svamp";
  if (normalized.includes('mossa') || normalized.includes('lav') || normalized.includes('moss')) return "mossa";
  if (normalized.includes('sten') || normalized.includes('mineral') || normalized.includes('rock')) return "sten";
  return "växt"; // Default fallback
};

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: string;
  description: string;
  category: string;
  confidence?: number;
  location?: string;
  notes?: string;
  capturedAt: Date;
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
    category: mapToCategory(species?.category || "okänd"),
    confidence: species?.confidence,
    location: capture.location_name,
    notes: capture.notes,
    capturedAt: capturedDate,
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
      }] : []),
      ...(capture.notes ? [{
        icon: "📝",
        title: "Anteckningar",
        description: capture.notes
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
  const [sortBy, setSortBy] = useState<string>("date");
  const [filterBy, setFilterBy] = useState<string>("all");
  
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();

  // Convert captures to species and apply filtering/sorting
  const processedSpecies = useMemo(() => {
    if (!captures) return [];
    
    let species = captures.map(convertCaptureToSpecies);
    
    // Apply filtering
    if (filterBy !== "all") {
      species = species.filter(s => s.category === filterBy);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "name":
        species.sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'));
        break;
      case "category":
        species.sort((a, b) => a.category.localeCompare(b.category, 'sv-SE'));
        break;
      case "date":
      default:
        species.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
        break;
    }
    
    return species;
  }, [captures, sortBy, filterBy]);

  // Group species by category, always show all categories
  const categorizedSpecies = useMemo(() => {
    const speciesByCategory = processedSpecies.reduce((acc, species) => {
      const categoryKey = species.category;
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(species);
      return acc;
    }, {} as Record<string, Species[]>);

    return PREDEFINED_CATEGORIES.map(category => ({
      name: category.name,
      key: category.key,
      count: speciesByCategory[category.key]?.length || 0,
      icon: category.icon,
      species: speciesByCategory[category.key] || []
    }));
  }, [processedSpecies]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? "" : categoryKey);
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

        {/* Filters and Sorting */}
        {processedSpecies.length > 0 && (
          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sortera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Senaste först</SelectItem>
                <SelectItem value="name">Artnamn A-Ö</SelectItem>
                <SelectItem value="category">Kategori</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                {PREDEFINED_CATEGORIES.map(category => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-3">
          {categorizedSpecies.map((category) => (
            <div key={category.key}>
              {/* Category Header */}
              <Card 
                className="cursor-pointer shadow-card hover:shadow-eco transition-shadow"
                onClick={() => toggleCategory(category.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                        {category.count === 0 && (
                          <p className="text-xs text-muted-foreground">Inga fångster än</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {category.count}
                      </Badge>
                      {expandedCategory === category.key ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Species Grid */}
              {expandedCategory === category.key && (
                <div className="mt-3">
                  {category.species.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <p>Inga fångster i denna kategori ännu</p>
                      <p className="text-sm">Börja utforska och fånga {category.name.toLowerCase()}!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {category.species.map((species) => (
                        <Card 
                          key={species.id}
                          className="cursor-pointer shadow-card hover:shadow-eco transition-all overflow-hidden"
                          onClick={() => setSelectedSpecies(species)}
                        >
                          <CardContent className="p-0">
                            <div className="flex gap-3">
                              {/* Image */}
                              <div className="w-24 h-24 flex-shrink-0">
                                <img 
                                  src={species.image}
                                  alt={species.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 p-3 min-w-0">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-foreground truncate">{species.name}</h4>
                                  <p className="text-xs text-muted-foreground italic truncate">{species.scientificName}</p>
                                  
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>📅</span>
                                    <span>{species.capturedAt.toLocaleDateString('sv-SE')}</span>
                                  </div>
                                  
                                  {species.location && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>📍</span>
                                      <span className="truncate">{species.location}</span>
                                    </div>
                                  )}
                                  
                                  {species.confidence && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span>🤖</span>
                                      <span className="text-primary">{Math.round(species.confidence * 100)}% säker</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state when no captures at all */}
        {processedSpecies.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl">📸</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Inga fångster än</h3>
              <p className="text-muted-foreground">
                Använd kameran för att ta din första bild och identifiera arter!
              </p>
            </div>
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