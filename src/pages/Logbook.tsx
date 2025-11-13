import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, AlertCircle, SortAsc, Star, Search, Download, Edit2, Trash2, Info, Filter, X, Share2 } from "lucide-react";
import { SpeciesModal } from "@/components/SpeciesModal";
import { useSpeciesCaptures, type ParsedSpeciesCapture } from "@/hooks/useSpeciesCaptures";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ImageViewer } from "@/components/ImageViewer";
import { exportToCSV, exportToJSON } from "@/utils/exportData";
import { EditCaptureDialog } from "@/components/EditCaptureDialog";
import { BannerAd } from "@/components/BannerAd";
import { Checkbox } from "@/components/ui/checkbox";
import { LazyImage } from "@/components/LazyImage";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useVibration } from "@/hooks/useVibration";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { formatGpsAccuracy, getGpsAccuracyIcon } from "@/utils/formatGpsAccuracy";
import { LogbookSkeleton } from "@/components/LoadingSkeleton";
import { ShareDialog } from "@/components/ShareDialog";
import { 
  getMainCategory, 
  getCategoryDisplayName, 
  MAIN_CATEGORY_DISPLAY, 
  MainCategoryKey,
  CATEGORY_TO_MAIN 
} from "@/types/species";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to map AI category to main category
const mapToCategory = (aiCategory: string): MainCategoryKey => {
  return getMainCategory(aiCategory);
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
  edibility?: string;
  ageStage?: string;
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
  const mainCategory = mapToCategory(species?.category || "annat");
  
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
    category: mainCategory, // Use main category for grouping
    confidence: species?.confidence,
    location: capture.location_name,
    notes: capture.notes,
    capturedAt: capturedDate,
    isFavorite: capture.is_favorite || false,
    edibility: capture.edibility,
    ageStage: capture.age_stage,
    facts: [
      // Show detailed category for all categories with subcategories
      ...(species?.category && MAIN_CATEGORY_DISPLAY[mainCategory]?.subcategories?.length > 0 ? [{
        icon: "🏷️",
        title: "Detaljerad kategori",
        description: getCategoryDisplayName(species.category)
      }] : []),
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
      ...(capture.edibility ? [{
        icon: "🍽️",
        title: "Ätlighet",
        description: capture.edibility
      }] : []),
      ...(capture.age_stage ? [{
        icon: "🔄",
        title: "Ålder/Stadium",
        description: capture.age_stage
      }] : []),
      ...(species?.confidence ? [{
        icon: "🤖",
        title: "AI-säkerhet",
        description: `${Math.round(species.confidence * 100)}% säker på identifieringen`
      }] : []),
      ...(capture.gps_accuracy ? [{
        icon: getGpsAccuracyIcon(capture.gps_accuracy),
        title: "GPS-noggrannhet",
        description: formatGpsAccuracy(capture.gps_accuracy)
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
    'blomma': '🌸',
    'buske': '🌱',
    'ört': '🌿',
    'träd': '🌳',
    'svamp': '🍄',
    'mossa': '🌾',
    'sten': '💎',
    'insekt': '🦋',
    'fågel': '🦅',
    'däggdjur': '🦌',
    'okänt': '❓'
  };
  return icons[category.toLowerCase()] || '🔍';
};

const Logbook = () => {
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [categorySortBy, setCategorySortBy] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; alt: string } | null>(null);
  const [editingCapture, setEditingCapture] = useState<{ id: string; notes: string } | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showAnnatInfoDialog, setShowAnnatInfoDialog] = useState(false);
  const isMobile = useIsMobile();
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});
  const [subcategoryFilter, setSubcategoryFilter] = useState<Record<string, string>>({});
  const [showEmptyCategories, setShowEmptyCategories] = useState(true);
  const [edibilityFilter, setEdibilityFilter] = useState<string>("");
  const [sharingCapture, setSharingCapture] = useState<{ id: string; image_url: string; species_name: string; scientific_name: string } | null>(null);
  
  const queryClient = useQueryClient();
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();
  const { vibrateSuccess, vibrateError, vibrateClick } = useVibration();
  const { subscription } = useSubscription();

  const loadMoreInCategory = (categoryKey: string, totalItems: number) => {
    const currentPage = categoryPages[categoryKey] || 1;
    const nextPage = currentPage + 1;
    if (nextPage * 10 < totalItems) {
      setCategoryPages(prev => ({ ...prev, [categoryKey]: nextPage }));
      vibrateClick();
    }
  };

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

  const toggleFavorite = async (speciesId: string, currentFavorite: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    vibrateClick();
    
    try {
      const { error } = await supabase
        .from('species_captures')
        .update({ is_favorite: !currentFavorite })
        .eq('id', speciesId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      vibrateSuccess();
      toast({
        title: !currentFavorite ? "Tillagd i favoriter" : "Borttagen från favoriter",
        description: !currentFavorite ? "Fångsten har markerats som favorit." : "Fångsten har tagits bort från favoriter.",
      });
    } catch (err) {
      vibrateError();
      console.error('Error toggling favorite:', err);
      toast({
        title: "Kunde inte uppdatera favorit",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    }
  };

  const handleEditNotes = async (notes: string) => {
    if (!editingCapture) return;

    try {
      const { error } = await supabase
        .from('species_captures')
        .update({ notes })
        .eq('id', editingCapture.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: "Anteckningar uppdaterade",
        description: "Dina ändringar har sparats.",
      });
    } catch (err) {
      console.error('Error updating notes:', err);
      toast({
        title: "Kunde inte uppdatera anteckningar",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
      throw err;
    }
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    vibrateClick();
    try {
      const { error } = await supabase
        .from('species_captures')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      vibrateSuccess();
      toast({
        title: "Fångster borttagna",
        description: `${selectedIds.size} fångster har tagits bort.`,
      });

      setSelectedIds(new Set());
      setBulkSelectMode(false);
      setShowBulkDeleteDialog(false);
    } catch (err) {
      vibrateError();
      console.error('Error bulk deleting:', err);
      toast({
        title: "Kunde inte ta bort fångster",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    }
  };

  // Convert captures to species with search filtering
  const allSpecies = useMemo(() => {
    if (!captures) return [];
    const converted = captures.map(convertCaptureToSpecies);
    
    if (!searchQuery.trim()) return converted;
    
    const query = searchQuery.toLowerCase();
    return converted.filter(species => 
      species.name.toLowerCase().includes(query) ||
      species.scientificName.toLowerCase().includes(query) ||
      species.description.toLowerCase().includes(query) ||
      (species.location && species.location.toLowerCase().includes(query))
    );
  }, [captures, searchQuery]);

  // Group species by category with infinite scroll per category
  const categorizedSpecies = useMemo(() => {
    const speciesByCategory = allSpecies.reduce((acc, species) => {
      const categoryKey = species.category;
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(species);
      return acc;
    }, {} as Record<string, Species[]>);

    const mainCategories = Object.keys(MAIN_CATEGORY_DISPLAY) as Array<keyof typeof MAIN_CATEGORY_DISPLAY>;
    
    return mainCategories.map(categoryKey => {
      let categorySpecies: Species[];
      
      // Special handling for favorites category
      if (categoryKey === "favoriter") {
        categorySpecies = allSpecies.filter(s => s.isFavorite);
      } else {
        categorySpecies = speciesByCategory[categoryKey as MainCategoryKey] || [];
      }

      // Apply subcategory filtering for categories with subcategories
      const hasSubcategories = categoryKey !== 'favoriter' && MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey]?.subcategories?.length > 0;
      if (hasSubcategories && subcategoryFilter[categoryKey]) {
        const filterValue = subcategoryFilter[categoryKey].toLowerCase();
        categorySpecies = categorySpecies.filter(species => {
          const detailedCategoryFact = species.facts.find(f => f.title === "Detaljerad kategori");
          return detailedCategoryFact?.description.toLowerCase() === filterValue;
        });
      }

      // Apply edibility filtering
      if (edibilityFilter && categoryKey === 'svampar') {
        categorySpecies = categorySpecies.filter(species => {
          return species.edibility?.toLowerCase().includes(edibilityFilter.toLowerCase());
        });
      }

      // Apply sorting per category
      const sortBy = categorySortBy[categoryKey] || "date";
      switch (sortBy) {
        case "name":
          categorySpecies.sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'));
          break;
        case "rarity":
          const rarityOrder = { "hotad": 0, "sällsynt": 1, "ovanlig": 2, "vanlig": 3 };
          categorySpecies.sort((a, b) => {
            const rarityFactA = a.facts.find(f => f.title === "Sällsynthet");
            const rarityFactB = b.facts.find(f => f.title === "Sällsynthet");
            const rarityA = rarityFactA?.description?.toLowerCase() || "vanlig";
            const rarityB = rarityFactB?.description?.toLowerCase() || "vanlig";
            return (rarityOrder[rarityA as keyof typeof rarityOrder] || 3) - (rarityOrder[rarityB as keyof typeof rarityOrder] || 3);
          });
          break;
        case "location":
          categorySpecies.sort((a, b) => (a.location || "").localeCompare(b.location || "", 'sv-SE'));
          break;
        case "date":
        default:
          categorySpecies.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
          break;
      }

      return {
        key: categoryKey,
        name: categoryKey === 'favoriter' ? 'Favoriter' : MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey].name,
        icon: categoryKey === 'favoriter' ? '⭐' : MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey].icon,
        count: categorySpecies.length,
        species: categorySpecies,
        subcategories: categoryKey !== 'favoriter' && MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey]?.subcategories || [],
        originalCount: hasSubcategories && subcategoryFilter[categoryKey]
          ? (speciesByCategory[categoryKey as MainCategoryKey] || []).length 
          : categorySpecies.length,
        infiniteScroll: {
          displayedItems: categorySpecies.slice(0, 10),
          hasMore: categorySpecies.length > 10,
          totalItems: categorySpecies.length
        },
        speciesByCategory // Pass it down for subcategory counting
      };
    }).filter(cat => showEmptyCategories || cat.count > 0);
  }, [allSpecies, categorySortBy, subcategoryFilter, showEmptyCategories, edibilityFilter]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? "" : categoryKey);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!captures) return;
    
    const exportData = captures.map(capture => {
      const species = capture.ai_analysis?.species;
      return {
        id: capture.id,
        name: species?.commonName || "Okänd",
        scientificName: species?.scientificName || "Okänd",
        category: species?.category || "okänt",
        capturedAt: new Date(capture.captured_at).toISOString(),
        location: capture.location_name,
        latitude: capture.latitude ? Number(capture.latitude) : undefined,
        longitude: capture.longitude ? Number(capture.longitude) : undefined,
        description: species?.description || "",
        habitat: species?.habitat,
        rarity: species?.rarity,
        confidence: species?.confidence,
        notes: capture.notes,
        isFavorite: capture.is_favorite || false
      };
    });

    if (format === 'csv') {
      exportToCSV(exportData);
      toast({
        title: "Export klar",
        description: `${exportData.length} fångster exporterade till CSV.`,
      });
    } else {
      exportToJSON(exportData);
      toast({
        title: "Export klar",
        description: `${exportData.length} fångster exporterade till JSON.`,
      });
    }
  };

  if (isLoading) {
    return <LogbookSkeleton />;
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
        {/* Banner Ad for Free Users */}
        {subscription?.tier === 'free' && <BannerAd position="bottom" />}
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Min Loggbok</h1>
              <p className="text-sm text-muted-foreground">
                {allSpecies.length} {allSpecies.length === 1 ? 'fångst' : 'fångster'}
              </p>
            </div>
            <div className="flex gap-2">
              {bulkSelectMode && (
                <>
                  {selectedIds.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Ta bort ({selectedIds.size})
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setBulkSelectMode(false);
                      setSelectedIds(new Set());
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Avbryt
                  </Button>
                </>
              )}
              {!bulkSelectMode && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setBulkSelectMode(true)}
                >
                  ☐
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Exportera som CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')}>
                    Exportera som JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök efter artnamn, plats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show empty categories toggle */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={showEmptyCategories}
                onCheckedChange={(checked) => setShowEmptyCategories(checked as boolean)}
              />
              <span className="text-muted-foreground">Visa tomma kategorier</span>
            </label>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categorizedSpecies.map((category) => (
            <div key={category.key}>
              {/* Category Header */}
              <Card 
                className={`shadow-card transition-shadow ${
                  category.count === 0 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'cursor-pointer hover:shadow-eco'
                }`}
                onClick={() => category.count > 0 && toggleCategory(category.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{category.name}</h3>
                          {category.key === 'spår-övrigt' && (
                            isMobile ? (
                              <button 
                                className="inline-flex items-center justify-center ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAnnatInfoDialog(true);
                                }}
                              >
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                              </button>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className="inline-flex items-center justify-center ml-1" 
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">
                                      "Spår och Övrigt" innehåller djurspår (fotavtryck, spillning, gnagspår), 
                                      samt objekt som inte passar i andra kategorier.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          )}
                          {category.subcategories && category.subcategories.length > 0 && subcategoryFilter[category.key] && (
                            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                              <Filter className="h-3 w-3 mr-1" />
                              {subcategoryFilter[category.key]}
                            </Badge>
                          )}
                        </div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {category.subcategories.join(' • ')}
                          </p>
                        )}
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
                  
                  {/* Category filters and sorting controls - shown when expanded */}
                  {expandedCategory === category.key && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Edibility filter for mushrooms */}
                      {category.key === 'svampar' && (
                        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b">
                          <span className="text-sm text-muted-foreground self-center">Ätlighet:</span>
                          <Button
                            variant={!edibilityFilter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEdibilityFilter("")}
                          >
                            Alla
                          </Button>
                          <Button
                            variant={edibilityFilter === "Ätlig" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEdibilityFilter("Ätlig")}
                            className={edibilityFilter === "Ätlig" ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            Ätlig
                          </Button>
                          <Button
                            variant={edibilityFilter === "Giftig" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEdibilityFilter("Giftig")}
                            className={edibilityFilter === "Giftig" ? "bg-red-600 hover:bg-red-700" : ""}
                          >
                            Giftig
                          </Button>
                          <Button
                            variant={edibilityFilter === "Ej ätlig" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEdibilityFilter("Ej ätlig")}
                          >
                            Ej ätlig
                          </Button>
                        </div>
                      )}

                      {/* Subcategory filter for categories with subcategories */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={!subcategoryFilter[category.key] ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSubcategoryFilter(prev => ({...prev, [category.key]: ""}))}
                          >
                            Alla ({(category as any).originalCount || category.count})
                          </Button>
                          {category.subcategories.map(subcat => {
                            const subcatLower = subcat.toLowerCase();
                            // Use the original unfiltered category species for accurate counts
                            const categoryAllSpecies = (category as any).speciesByCategory?.[category.key as MainCategoryKey] || category.species;
                            const subcatCount = categoryAllSpecies.filter((s: Species) => {
                              const detailedCategoryFact = s.facts.find(f => f.title === "Detaljerad kategori");
                              return detailedCategoryFact?.description.toLowerCase() === subcatLower;
                            }).length;
                            
                            return (
                              <Button
                                key={subcat}
                                variant={subcategoryFilter[category.key] === subcat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSubcategoryFilter(prev => ({...prev, [category.key]: subcat}))}
                              >
                                {subcat} ({subcatCount})
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Sorting controls */}
                      {category.species.length > 0 && (
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
                            <SelectItem value="rarity">Sällsynthet</SelectItem>
                            <SelectItem value="location">Plats</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
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
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {category.species.slice(0, (categoryPages[category.key] || 1) * 10).map((species) => (
                        <Card 
                          key={species.id}
                          className="shadow-card hover:shadow-eco transition-all overflow-hidden group"
                        >
                          <CardContent className="p-0">
                             <div 
                              className="relative aspect-square cursor-pointer"
                              onClick={() => !bulkSelectMode && setSelectedSpecies(species)}
                            >
                              <LazyImage 
                                src={species.image}
                                alt={species.name}
                                className="w-full h-full"
                              />
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              
                              {/* Bulk select checkbox */}
                              {bulkSelectMode && (
                                <div 
                                  className="absolute top-2 left-2 z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBulkSelect(species.id);
                                  }}
                                >
                                  <Checkbox 
                                    checked={selectedIds.has(species.id)}
                                    className="bg-white/90"
                                  />
                                </div>
                              )}
                              
                              {/* Favorite button */}
                              {!bulkSelectMode && (
                                <button
                                  onClick={(e) => toggleFavorite(species.id, species.isFavorite || false, e)}
                                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                                >
                                  <Star 
                                    className={`h-4 w-4 ${species.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
                                  />
                                </button>
                              )}
                              
                              {/* Edit button */}
                              {!bulkSelectMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCapture({ id: species.id, notes: species.notes || "" });
                                  }}
                                  className="absolute bottom-12 right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                                >
                                  <Edit2 className="h-4 w-4 text-white" />
                                </button>
                              )}

                              {/* Share button */}
                              {!bulkSelectMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const capture = captures?.find(c => c.id === species.id);
                                    if (capture) {
                                      setSharingCapture({
                                        id: capture.id,
                                        image_url: capture.image_url,
                                        species_name: capture.ai_analysis?.species?.commonName || "Okänd art",
                                        scientific_name: capture.ai_analysis?.species?.scientificName || "Okänd"
                                      });
                                    }
                                  }}
                                  className="absolute bottom-12 right-14 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                                >
                                  <Share2 className="h-4 w-4 text-white" />
                                </button>
                              )}
                              
                              {/* Edibility badge */}
                              {species.edibility && (
                                <div className="absolute top-2 left-2 z-10">
                                  <Badge 
                                    variant="secondary"
                                    className={`
                                      ${species.edibility.toLowerCase().includes('ätlig') || species.edibility.toLowerCase().includes('matsvamp') 
                                        ? 'bg-green-500/90 text-white border-green-600' 
                                        : species.edibility.toLowerCase().includes('giftig') || species.edibility.toLowerCase().includes('dödlig')
                                        ? 'bg-red-500/90 text-white border-red-600'
                                        : 'bg-yellow-500/90 text-white border-yellow-600'
                                      }
                                    `}
                                  >
                                    {species.edibility.toLowerCase().includes('ätlig') || species.edibility.toLowerCase().includes('matsvamp') 
                                      ? '✓ Ätlig' 
                                      : species.edibility.toLowerCase().includes('giftig') || species.edibility.toLowerCase().includes('dödlig')
                                      ? '⚠ Giftig'
                                      : '? Okänd'
                                    }
                                  </Badge>
                                </div>
                              )}

                              {/* Text overlay */}
                              <div 
                                className="absolute bottom-0 left-0 right-0 p-3 text-white"
                              >
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
                      {/* Load more button */}
                      {category.species.length > (categoryPages[category.key] || 1) * 10 && (
                        <div className="mt-4 text-center">
                          <Button 
                            variant="outline" 
                            onClick={() => loadMoreInCategory(category.key, category.species.length)}
                          >
                            Ladda fler ({category.species.length - (categoryPages[category.key] || 1) * 10} kvar)
                          </Button>
                        </div>
                      )}
                    </>
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
          onDelete={handleDelete}
          isDeleting={isDeleting}
          showActions={true}
        />
      )}
      
      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <ImageViewer
          imageUrl={fullscreenImage.url}
          alt={fullscreenImage.alt}
          isOpen={!!fullscreenImage}
          onClose={() => setFullscreenImage(null)}
        />
      )}
      
      {/* Edit Capture Dialog */}
      {editingCapture && (
        <EditCaptureDialog
          open={!!editingCapture}
          onOpenChange={(open) => !open && setEditingCapture(null)}
          currentNotes={editingCapture.notes}
          onSave={handleEditNotes}
        />
      )}
      
      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort {selectedIds.size} {selectedIds.size === 1 ? 'fångst' : 'fångster'}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Du håller på att ta bort <span className="font-semibold">{selectedIds.size}</span> {selectedIds.size === 1 ? 'fångst' : 'fångster'} permanent. 
                Detta går inte att ångra.
              </p>
              {selectedIds.size >= 10 && (
                <p className="text-destructive font-semibold flex items-center gap-2 mt-3 p-3 bg-destructive/10 rounded-md">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Varning: Du tar bort {selectedIds.size} fångster! Kontrollera att du valt rätt innan du fortsätter.</span>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ta bort {selectedIds.size} {selectedIds.size === 1 ? 'fångst' : 'fångster'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spår och Övrigt Info Dialog */}
      <AlertDialog open={showAnnatInfoDialog} onOpenChange={setShowAnnatInfoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Om kategorin "Spår och Övrigt"</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-sm">
              <p>
                Denna kategori innehåller två typer av fynd:
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">🐾 Spår</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>Fotavtryck och klösmärken</li>
                    <li>Spillning och fekalier</li>
                    <li>Gnagspår och bitmärken</li>
                    <li>Fjädrar och fjällar</li>
                    <li>Andra tecken på djurens närvaro</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">❓ Övrigt</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                    <li>Fynd som AI:n inte kunde identifiera med säkerhet</li>
                    <li>Objekt som inte passar i andra kategorier</li>
                    <li>Konstgjorda ting eller landskapselement</li>
                  </ul>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Tips: Använd anteckningsfunktionen för att lägga till egna observationer om fynd i denna kategori.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      {sharingCapture && (
        <ShareDialog
          isOpen={!!sharingCapture}
          onClose={() => setSharingCapture(null)}
          capture={{
            id: sharingCapture.id,
            image_url: sharingCapture.image_url,
            species_name: sharingCapture.species_name,
            scientific_name: sharingCapture.scientific_name
          }}
        />
      )}
    </div>
  );
};

export default Logbook;