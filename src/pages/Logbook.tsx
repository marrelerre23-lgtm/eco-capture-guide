import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, AlertCircle, AlertTriangle, SortAsc, Star, Search, Download, Edit2, Trash2, Info, Filter, X, Share2, Flag, MoreVertical } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LazyImage } from "@/components/LazyImage";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useVibration } from "@/hooks/useVibration";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { formatGpsAccuracy, getGpsAccuracyIcon } from "@/utils/formatGpsAccuracy";
import { LogbookSkeleton } from "@/components/LoadingSkeleton";
import { ShareDialog } from "@/components/ShareDialog";
import { RecategorizationDialog } from "@/components/RecategorizationDialog";
import { FilterDrawer } from "@/components/FilterDrawer";
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
  ageStage?: string;
  gpsAccuracy?: number;
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
    ageStage: capture.age_stage,
    gpsAccuracy: capture.gps_accuracy,
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
  const [gpsAccuracyFilter, setGpsAccuracyFilter] = useState<string>("");
  const [sharingCapture, setSharingCapture] = useState<{ id: string; image_url: string; species_name: string; scientific_name: string } | null>(null);
  const [recategorizingCapture, setRecategorizingCapture] = useState<{ id: string; category: string; name: string } | null>(null);
  const [showBulkRecategorizeDialog, setShowBulkRecategorizeDialog] = useState(false);
  const [bulkRecategoryTarget, setBulkRecategoryTarget] = useState<string>("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();
  const { vibrateSuccess, vibrateError, vibrateClick } = useVibration();
  const { subscription } = useSubscription();

  const loadMoreInCategory = (categoryKey: string, totalItems: number) => {
    const currentPage = categoryPages[categoryKey] || 1;
    const nextPage = currentPage + 1;
    // FIX #8: More items per page on desktop for better UX
    const itemsPerPage = isMobile ? 10 : 20;
    if (nextPage * itemsPerPage < totalItems) {
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

  const handleEditNotes = async (notes: string, newCategory?: string) => {
    if (!editingCapture) return;

    try {
      // If category is being changed, update ai_analysis
      if (newCategory) {
        const { data: capture, error: fetchError } = await supabase
          .from('species_captures')
          .select('ai_analysis')
          .eq('id', editingCapture.id)
          .single();

        if (fetchError) throw fetchError;

        const currentAnalysis = (capture.ai_analysis || {}) as Record<string, any>;
        const currentSpecies = (currentAnalysis.species || {}) as Record<string, any>;
        
        const updatedAnalysis = {
          ...currentAnalysis,
          species: {
            ...currentSpecies,
            category: newCategory
          }
        };

        const { error } = await supabase
          .from('species_captures')
          .update({ notes, ai_analysis: updatedAnalysis })
          .eq('id', editingCapture.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('species_captures')
          .update({ notes })
          .eq('id', editingCapture.id);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: newCategory ? "Fångst uppdaterad" : "Anteckningar uppdaterade",
        description: newCategory ? "Kategori och anteckningar har sparats." : "Dina ändringar har sparats.",
      });
    } catch (err) {
      console.error('Error updating capture:', err);
      toast({
        title: "Kunde inte uppdatera",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleBulkRecategorize = async () => {
    if (selectedIds.size === 0 || !bulkRecategoryTarget) return;

    vibrateClick();
    try {
      // Update all selected captures
      const captureIds = Array.from(selectedIds);
      
      for (const captureId of captureIds) {
        const { data: capture, error: fetchError } = await supabase
          .from('species_captures')
          .select('ai_analysis')
          .eq('id', captureId)
          .single();

        if (fetchError) continue;

        const currentAnalysis = (capture.ai_analysis || {}) as Record<string, any>;
        const currentSpecies = (currentAnalysis.species || {}) as Record<string, any>;
        
        const updatedAnalysis = {
          ...currentAnalysis,
          species: {
            ...currentSpecies,
            category: bulkRecategoryTarget
          }
        };

        await supabase
          .from('species_captures')
          .update({ ai_analysis: updatedAnalysis })
          .eq('id', captureId);
      }

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      vibrateSuccess();
      toast({
        title: "Fångster omkategoriserade",
        description: `${selectedIds.size} fångster har flyttats till ny kategori.`,
      });

      setSelectedIds(new Set());
      setBulkSelectMode(false);
      setShowBulkRecategorizeDialog(false);
      setBulkRecategoryTarget("");
    } catch (err) {
      vibrateError();
      console.error('Error bulk recategorizing:', err);
      toast({
        title: "Kunde inte omkategorisera fångster",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
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

  // #15: Select/Deselect all in bulk mode
  const handleSelectAll = () => {
    if (!allSpecies) return;
    const allIds = new Set(allSpecies.map(s => s.id));
    setSelectedIds(allIds);
    vibrateClick();
    toast({
      title: "Alla fångster valda",
      description: `${allIds.size} fångster markerade`,
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    vibrateClick();
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

  const handleReanalyzeCaptures = async () => {
    console.log('🔄 [Reanalyze] Starting re-analysis process...');
    console.log('🔄 [Reanalyze] Current user session:', await supabase.auth.getSession());
    
    setIsReanalyzing(true);
    vibrateClick();

    try {
      console.log('🔄 [Reanalyze] Invoking reanalyze-captures edge function...');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('reanalyze-captures');
      
      const duration = Date.now() - startTime;
      console.log(`🔄 [Reanalyze] Response received in ${duration}ms:`, { data, error });

      if (error) {
        console.error('❌ [Reanalyze] Edge function returned error:', error);
        throw error;
      }

      console.log('✅ [Reanalyze] Success! Results:', {
        updated: data?.updated,
        failed: data?.failed,
        total: data?.total,
        message: data?.message
      });
      
      console.log('🔄 [Reanalyze] Invalidating query cache...');
      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      vibrateSuccess();
      toast({
        title: "Re-analys klar!",
        description: data.message || `${data.updated} fångster uppdaterade`,
      });
    } catch (err) {
      vibrateError();
      console.error('❌ [Reanalyze] Error during re-analysis:', err);
      console.error('❌ [Reanalyze] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown',
        stack: err instanceof Error ? err.stack : undefined,
        full: err
      });
      toast({
        title: "Kunde inte re-analysera fångster",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Convert captures to species with search filtering
  const allSpecies = useMemo(() => {
    if (!captures) return [];
    const converted = captures.map(convertCaptureToSpecies);
    
    if (!searchQuery.trim()) return converted;
    
    const query = searchQuery.toLowerCase();
    // FIX #10: Search in detailed category (from facts array) and all other fields
    return converted.filter(species => 
      species.name.toLowerCase().includes(query) ||
      species.scientificName.toLowerCase().includes(query) ||
      species.description.toLowerCase().includes(query) ||
      (species.location && species.location.toLowerCase().includes(query)) ||
      species.facts.some(fact => 
        fact.title.toLowerCase().includes(query) || 
        fact.description.toLowerCase().includes(query)
      )
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

      // Apply edibility filtering for relevant categories
      if (edibilityFilter && ['svampar', 'örter-blommor', 'träd-vedartade'].includes(categoryKey)) {
        categorySpecies = categorySpecies.filter(species => {
          if (!species.edibility) return false; // Filter out NULL values
          const edibility = species.edibility.toLowerCase();
          const filter = edibilityFilter.toLowerCase();
          
          // Intelligent matching for "ätlig" - includes "ätlig-med-förbehåll"
          if (filter === 'ätlig') {
            return edibility === 'ätlig' || edibility === 'ätlig-med-förbehåll';
          }
          // Exact or substring match for other filters
          return edibility === filter || edibility.includes(filter);
        });
      }

      // Apply GPS accuracy filter
      if (gpsAccuracyFilter) {
        categorySpecies = categorySpecies.filter(species => {
          if (!species.gpsAccuracy) return false; // Filter out captures without GPS data
          
          if (gpsAccuracyFilter === 'high') {
            return species.gpsAccuracy <= 50; // High accuracy: ≤50m
          } else if (gpsAccuracyFilter === 'medium') {
            return species.gpsAccuracy > 50 && species.gpsAccuracy <= 100; // Medium: 50-100m
          } else if (gpsAccuracyFilter === 'low') {
            return species.gpsAccuracy > 100; // Low: >100m
          }
          return true;
        });
      }

      // Apply sorting per category
      const sortBy = categorySortBy[categoryKey] || "date";
      switch (sortBy) {
        case "name":
          categorySpecies.sort((a, b) => a.name.localeCompare(b.name, 'sv-SE'));
          break;
        case "rarity":
          // Fuzzy matching for rarity values
          const getRarityScore = (rarity: string): number => {
            const r = rarity.toLowerCase();
            if (r.includes('hotad') || r.includes('critically')) return 0;
            if (r.includes('mycket sällsynt') || r.includes('extremely rare')) return 1;
            if (r.includes('sällsynt') || r.includes('rare')) return 2;
            if (r.includes('ovanlig') || r.includes('uncommon')) return 3;
            if (r.includes('relativt vanlig') || r.includes('fairly common')) return 4;
            if (r.includes('vanlig') || r.includes('common')) return 5;
            return 5; // Default to common
          };
          categorySpecies.sort((a, b) => {
            const rarityFactA = a.facts.find(f => f.title === "Sällsynthet");
            const rarityFactB = b.facts.find(f => f.title === "Sällsynthet");
            const rarityA = rarityFactA?.description || "vanlig";
            const rarityB = rarityFactB?.description || "vanlig";
            return getRarityScore(rarityA) - getRarityScore(rarityB);
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

      // FIX #2: Calculate original count correctly for subcategory filtering
      const originalCategoryCount = (speciesByCategory[categoryKey as MainCategoryKey] || []).length;
      const isSubcategoryActive = hasSubcategories && subcategoryFilter[categoryKey];
      
      return {
        key: categoryKey,
        name: categoryKey === 'favoriter' ? 'Favoriter' : MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey].name,
        icon: categoryKey === 'favoriter' ? '⭐' : MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey].icon,
        count: categorySpecies.length,
        species: categorySpecies,
        subcategories: categoryKey !== 'favoriter' && MAIN_CATEGORY_DISPLAY[categoryKey as MainCategoryKey]?.subcategories || [],
        originalCount: isSubcategoryActive ? originalCategoryCount : categorySpecies.length,
        isSubcategoryFiltered: isSubcategoryActive,
        infiniteScroll: {
          // FIX #8: More items per page on desktop, fewer on mobile
          displayedItems: categorySpecies.slice(0, (categoryPages[categoryKey] || 1) * (isMobile ? 10 : 20)),
          hasMore: categorySpecies.length > (categoryPages[categoryKey] || 1) * (isMobile ? 10 : 20),
          totalItems: categorySpecies.length
        },
        speciesByCategory // Pass it down for subcategory counting
      };
    }).filter(cat => showEmptyCategories || cat.count > 0);
  }, [allSpecies, categorySortBy, subcategoryFilter, showEmptyCategories]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? "" : categoryKey);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!captures) return;
    
    // FIX #9: Include all relevant fields in export
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
        gpsAccuracy: capture.gps_accuracy ? Number(capture.gps_accuracy) : undefined,
        description: species?.description || "",
        habitat: species?.habitat,
        rarity: species?.rarity,
        confidence: species?.confidence,
        
        ageStage: capture.age_stage,
        notes: capture.notes,
        isFavorite: capture.is_favorite || false,
        imageUrl: capture.image_url
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

  // Calculate percentage of captures in "Spår och Övrigt"
  const sparOvrigtCategory = categorizedSpecies.find(cat => cat.key === 'spår-övrigt');
  const sparOvrigtPercentage = allSpecies.length > 0 
    ? (sparOvrigtCategory?.count || 0) / allSpecies.length 
    : 0;
  const showMiscategorizationWarning = sparOvrigtPercentage > 0.3 && allSpecies.length >= 5;

  // Count active filters
  const activeFilterCount = [
    gpsAccuracyFilter,
    ...Object.values(subcategoryFilter).filter(v => v)
  ].filter(Boolean).length;

  // Get active filter chips data
  const activeFilters = [
    ...(gpsAccuracyFilter ? [{
      label: `GPS: ${gpsAccuracyFilter === 'high' ? 'Hög' : gpsAccuracyFilter === 'medium' ? 'Medel' : 'Låg'}`, 
      onRemove: () => setGpsAccuracyFilter("") 
    }] : []),
    ...Object.entries(subcategoryFilter).filter(([_, v]) => v).map(([cat, val]) => ({
      label: `${cat}: ${val}`,
      onRemove: () => setSubcategoryFilter(prev => ({...prev, [cat]: ""}))
    }))
  ];

  const handleClearAllFilters = () => {
    setGpsAccuracyFilter("");
    setSubcategoryFilter({});
  };

  // Get available subcategories for FilterDrawer
  const availableSubcategories = categorizedSpecies
    .filter(cat => cat.subcategories && cat.subcategories.length > 0)
    .map(cat => ({
      category: cat.name,
      subcategories: cat.subcategories || [],
      counts: (cat.subcategories || []).reduce((acc, subcat) => {
        const subcatLower = subcat.toLowerCase();
        const count = allSpecies.filter(s => {
          const mainCat = mapToCategory(s.category);
          if (mainCat !== cat.key) return false;
          const detailedCategoryFact = s.facts.find(f => f.title === "Detaljerad kategori");
          return detailedCategoryFact?.description.toLowerCase() === subcatLower;
        }).length;
        acc[subcat] = count;
        return acc;
      }, {} as Record<string, number>)
    }));

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-4">
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
              {/* Filter button with badge */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDrawerOpen(true)}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {bulkSelectMode && (
                <>
                  {selectedIds.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                      >
                        Avmarkera alla
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowBulkRecategorizeDialog(true)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Byt kategori
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Ta bort ({selectedIds.size})
                      </Button>
                    </>
                  )}
                  {selectedIds.size === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Välj alla
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
                  <DropdownMenuItem 
                    onClick={handleReanalyzeCaptures}
                    disabled={isReanalyzing}
                    className="text-primary"
                  >
                    {isReanalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyserar om...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Uppdatera ätbarhet
                      </>
                    )}
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

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {activeFilters.map((filter, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {filter.label}
                  <button
                    onClick={filter.onRemove}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="h-6 text-xs"
              >
                Rensa alla
              </Button>
            </div>
          )}

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

          {/* Miscategorization Warning Banner */}
          {showMiscategorizationWarning && (
            <Card className="border-orange-500/50 bg-orange-500/10">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="font-medium text-foreground">
                      Många fångster kategoriserade som "Spår och Övrigt"
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(sparOvrigtPercentage * 100)}% av dina fångster ({sparOvrigtCategory?.count} av {allSpecies.length}) 
                      är kategoriserade som "Spår och Övrigt". Detta kan bero på att AI:n var osäker på identifieringen. 
                      Du kan omkategorisera felaktiga fångster genom att klicka på flaggikonen på varje fångst.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categorizedSpecies.map((category) => (
            <div key={category.key} className="transition-all duration-300 ease-in-out">
              {/* Category Header */}
              <Card 
                className={`shadow-card transition-all duration-200 ${
                  category.count === 0 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'cursor-pointer hover:shadow-eco hover:scale-[1.01]'
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
                        {category.isSubcategoryFiltered 
                          ? `${category.count} av ${category.originalCount}`
                          : category.count
                        }
                      </Badge>
                      {expandedCategory === category.key ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Sorting controls - shown when expanded */}
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
                          <SelectItem value="rarity">Sällsynthet</SelectItem>
                          <SelectItem value="location">Plats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Species Grid */}
              {expandedCategory === category.key && (
                <div className="mt-3 animate-fade-in">
                  {category.species.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <p>Inga fångster i denna kategori ännu</p>
                      <p className="text-sm">Börja utforska och fånga {category.name.toLowerCase()}!</p>
                    </div>
                  ) : (
                    <>
                      {/* Empty results feedback when filters are active but no results */}
                      {category.species.length === 0 && (subcategoryFilter[category.key] || gpsAccuracyFilter) && (
                        <div className="py-8 text-center space-y-2 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20 mb-4">
                          <Filter className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-sm font-medium text-muted-foreground">Inga fångster matchar filtret</p>
                          <p className="text-xs text-muted-foreground/70">
                            {subcategoryFilter[category.key] && `${subcategoryFilter[category.key]}`}
                            {gpsAccuracyFilter && ` • GPS: ${gpsAccuracyFilter === 'high' ? 'Hög' : gpsAccuracyFilter === 'medium' ? 'Medel' : 'Låg'} noggrannhet`}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSubcategoryFilter(prev => ({...prev, [category.key]: ""}));
                              setGpsAccuracyFilter("");
                            }}
                            className="mt-2"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rensa filter
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        {category.species.slice(0, (categoryPages[category.key] || 1) * 10).map((species) => (
                        <Card 
                          key={species.id}
                          className="shadow-card hover:shadow-eco transition-all overflow-hidden"
                        >
                          <CardContent className="p-0">
                            <div 
                              className="relative aspect-square cursor-pointer"
                              onClick={() => !bulkSelectMode && setSelectedSpecies(species)}
                            >
                              <LazyImage 
                                src={species.image}
                                alt={species.name}
                                className="w-full h-full object-cover"
                              />
                              
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

                              {/* Actions dropdown menu */}
                              {!bulkSelectMode && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="absolute bottom-2 right-2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                                    >
                                      <MoreVertical className="h-4 w-4 text-white" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCapture({ id: species.id, notes: species.notes || "" });
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Redigera anteckningar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
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
                                    >
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Dela
                                    </DropdownMenuItem>
                                    {category.key === 'spår-övrigt' && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const capture = captures?.find(c => c.id === species.id);
                                          if (capture) {
                                            const detailedCategoryFact = species.facts.find(f => f.title === "Detaljerad kategori");
                                            setRecategorizingCapture({
                                              id: capture.id,
                                              category: detailedCategoryFact?.description || "spår",
                                              name: species.name
                                            });
                                          }
                                        }}
                                      >
                                        <Flag className="h-4 w-4 mr-2" />
                                        Rapportera felkategorisering
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              
                              {/* Age/Stage badge */}
                              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                {species.ageStage && (
                                  <Badge 
                                    variant="secondary"
                                    className="bg-blue-500/90 text-white border-blue-600 text-xs"
                                  >
                                    {species.ageStage}
                                  </Badge>
                                )}
                              </div>

                            {/* Species info below image */}
                            <div className="p-3 space-y-1">
                              <h4 className="font-semibold text-sm leading-tight line-clamp-1">
                                {species.name}
                              </h4>
                              <p className="text-xs italic text-muted-foreground line-clamp-1">
                                {species.scientificName}
                              </p>
                              {species.location && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>📍</span>
                                  <span className="line-clamp-1">{species.location}</span>
                                </p>
                              )}
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
          currentCategory={allSpecies.find(s => s.id === editingCapture.id)?.category}
          onSave={handleEditNotes}
        />
      )}
      
      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort {selectedIds.size} {selectedIds.size === 1 ? 'fångst' : 'fångster'}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Du håller på att ta bort <span className="font-semibold">{selectedIds.size}</span> {selectedIds.size === 1 ? 'fångst' : 'fångster'} permanent. 
                Detta går inte att ångra.
              </p>
              
              {/* FIX #8: Warning from 3+ items with tiered levels */}
              {selectedIds.size >= 3 && selectedIds.size < 5 && (
                <div className="flex items-start gap-2 bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-yellow-600">Bekräfta radering</p>
                    <p className="text-foreground">
                      Du tar bort {selectedIds.size} fångster permanent. Denna åtgärd kan inte ångras.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Warning for 5-9 items */}
              {selectedIds.size >= 5 && selectedIds.size < 10 && (
                <div className="flex items-start gap-2 bg-warning/10 p-3 rounded-md border border-warning/20">
                  <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-warning">Varning!</p>
                    <p className="text-foreground">
                      Du tar bort {selectedIds.size} fångster. Kontrollera att du valt rätt innan du fortsätter.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Strong warning for 10+ items */}
              {selectedIds.size >= 10 && (
                <div className="flex items-start gap-2 bg-destructive/10 p-3 rounded-md border-2 border-destructive/30">
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-destructive text-base">VARNING: Stor radering!</p>
                    <p className="text-foreground">
                      Du håller på att ta bort <span className="font-bold">{selectedIds.size}</span> fångster permanent. 
                      Detta är en stor mängd data som inte kan återställas.
                    </p>
                    <p className="text-muted-foreground italic">
                      Dubbelkolla noga att du verkligen vill ta bort alla dessa fångster.
                    </p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className={`${
                selectedIds.size >= 10 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold' 
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
            >
              {selectedIds.size >= 10 ? '⚠️ ' : ''}Ta bort {selectedIds.size} {selectedIds.size === 1 ? 'fångst' : 'fångster'}
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

      {/* Recategorization Dialog */}
      {recategorizingCapture && (
        <RecategorizationDialog
          captureId={recategorizingCapture.id}
          currentCategory={recategorizingCapture.category}
          speciesName={recategorizingCapture.name}
          open={!!recategorizingCapture}
          onOpenChange={(open) => !open && setRecategorizingCapture(null)}
        />
      )}

      {/* Bulk Recategorization Dialog */}
      <AlertDialog open={showBulkRecategorizeDialog} onOpenChange={setShowBulkRecategorizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ändra kategori för flera fångster</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Välj ny kategori för <span className="font-semibold">{selectedIds.size}</span> markerade {selectedIds.size === 1 ? 'fångst' : 'fångster'}.
              </p>
              <div className="py-2">
                <Select value={bulkRecategoryTarget} onValueChange={setBulkRecategoryTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MAIN_CATEGORY_DISPLAY) as MainCategoryKey[])
                      .filter(key => !['favoriter' as MainCategoryKey].includes(key))
                      .map(key => {
                        const cat = MAIN_CATEGORY_DISPLAY[key];
                        if (cat.subcategories && cat.subcategories.length > 0) {
                          return cat.subcategories.map(sub => (
                            <SelectItem key={sub} value={sub}>
                              {cat.icon} {cat.name} → {sub.charAt(0).toUpperCase() + sub.slice(1)}
                            </SelectItem>
                          ));
                        }
                        return (
                          <SelectItem key={key} value={key}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkRecategoryTarget("")}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkRecategorize}
              disabled={!bulkRecategoryTarget}
            >
              Uppdatera {selectedIds.size} {selectedIds.size === 1 ? 'fångst' : 'fångster'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filter Drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        showEdibilityFilter={false}
        edibilityFilter=""
        onEdibilityChange={() => {}}
        gpsAccuracyFilter={gpsAccuracyFilter}
        onGpsAccuracyChange={setGpsAccuracyFilter}
        subcategoryFilter={subcategoryFilter}
        onSubcategoryChange={(cat, val) => {
          setSubcategoryFilter(prev => ({...prev, [cat]: val}));
        }}
        availableSubcategories={availableSubcategories}
        onClearAll={handleClearAllFilters}
      />
    </div>
  );
};

export default Logbook;