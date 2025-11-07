import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, AlertCircle, Filter, SortAsc, Star } from "lucide-react";
import { SpeciesModal } from "@/components/SpeciesModal";
import { useSpeciesCaptures, type ParsedSpeciesCapture } from "@/hooks/useSpeciesCaptures";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Predefined categories that always show
const PREDEFINED_CATEGORIES = [
  { name: "Favoriter", icon: "⭐", key: "favoriter" },
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
  isFavorite?: boolean;
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
    isFavorite: capture.is_favorite || false,
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
  const [categorySortBy, setCategorySortBy] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();

  const handleDelete = async () => {
    if (!selectedSpecies) return;

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('species_captures')
        .delete()
        .eq('id', selectedSpecies.id);

      if (deleteError) throw deleteError;

      // Invalidate the query cache so all components get updated data
      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: "Fångst borttagen",
        description: `${selectedSpecies.name} har tagits bort från din loggbok.`,
      });

      setSelectedSpecies(null);
    } catch (err) {
      console.error('Error deleting capture:', err);
      toast({
        title: "Kunde inte ta bort fångst",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedSpecies) return;

    const location = prompt("Ange platsnamn för denna fångst:", selectedSpecies.location || "");
    if (location === null) return; // User cancelled

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('species_captures')
        .update({ location_name: location })
        .eq('id', selectedSpecies.id);

      if (error) throw error;

      // Invalidate the query cache so all components get updated data
      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: "Plats sparad",
        description: `Plats "${location}" har sparats för ${selectedSpecies.name}.`,
      });

      setSelectedSpecies(null);
    } catch (err) {
      console.error('Error saving location:', err);
      toast({
        title: "Kunde inte spara plats",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async (speciesId: string, currentFavorite: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('species_captures')
        .update({ is_favorite: !currentFavorite })
        .eq('id', speciesId);

      if (error) throw error;

      // Invalidate the query cache so all components get updated data
      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: !currentFavorite ? "Tillagd i favoriter" : "Borttagen från favoriter",
        description: !currentFavorite ? "Fångsten har markerats som favorit." : "Fångsten har tagits bort från favoriter.",
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast({
        title: "Kunde inte uppdatera favorit",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    }
  };

  // Convert captures to species (no global filtering/sorting)
  const allSpecies = useMemo(() => {
    if (!captures) return [];
    return captures.map(convertCaptureToSpecies);
  }, [captures]);

  // Group species by category, always show all categories
  const categorizedSpecies = useMemo(() => {
    const speciesByCategory = allSpecies.reduce((acc, species) => {
      const categoryKey = species.category;
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(species);
      return acc;
    }, {} as Record<string, Species[]>);

    return PREDEFINED_CATEGORIES.map(category => {
      let categorySpecies: Species[];
      
      // Special handling for favorites category
      if (category.key === "favoriter") {
        categorySpecies = allSpecies.filter(s => s.isFavorite);
      } else {
        categorySpecies = speciesByCategory[category.key] || [];
      }
      
      // Apply sorting per category
      const sortBy = categorySortBy[category.key] || "date";
      switch (sortBy) {
        case "name":
          categorySpecies.sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'));
          break;
        case "date":
        default:
          categorySpecies.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
          break;
      }

      return {
        name: category.name,
        key: category.key,
        count: categorySpecies.length,
        icon: category.icon,
        species: categorySpecies
      };
    });
  }, [allSpecies, categorySortBy]);

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

        {/* Filters and Sorting - removed, now per-category */}

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
                  
                  {/* Category sorting controls - shown when expanded and has species */}
                  {expandedCategory === category.key && category.species.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={categorySortBy[category.key] || "date"} 
                        onValueChange={(value) => setCategorySortBy(prev => ({...prev, [category.key]: value}))}
                      >
                        <SelectTrigger className="w-40">
                          <SortAsc className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Sortera" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Senaste först</SelectItem>
                          <SelectItem value="name">Artnamn A-Ö</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                    <div className="grid grid-cols-2 gap-3">
                      {category.species.map((species) => (
                        <Card 
                          key={species.id}
                          className="cursor-pointer shadow-card hover:shadow-eco transition-all overflow-hidden group"
                          onClick={() => setSelectedSpecies(species)}
                        >
                          <CardContent className="p-0">
                            <div className="relative aspect-square">
                              <img 
                                src={species.image}
                                alt={species.name}
                                className="w-full h-full object-cover"
                              />
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              
                              {/* Favorite button */}
                              <button
                                onClick={(e) => toggleFavorite(species.id, species.isFavorite || false, e)}
                                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                              >
                                <Star 
                                  className={`h-4 w-4 ${species.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
                                />
                              </button>
                              
                              {/* Text overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                <h4 className="font-semibold text-sm leading-tight mb-0.5">
                                  {species.name}
                                </h4>
                                <p className="text-xs italic opacity-90">
                                  {species.scientificName}
                                </p>
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
        {allSpecies.length === 0 && (
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
          onSave={handleSaveLocation}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          showActions={true}
        />
      )}
    </div>
  );
};

export default Logbook;