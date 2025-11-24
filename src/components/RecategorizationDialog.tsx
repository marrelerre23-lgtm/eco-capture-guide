import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAIN_CATEGORY_DISPLAY, MainCategoryKey } from "@/types/species";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface RecategorizationDialogProps {
  captureId: string;
  currentCategory: string;
  speciesName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecategorizationDialog = ({
  captureId,
  currentCategory,
  speciesName,
  open,
  onOpenChange,
}: RecategorizationDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // Get all valid main categories except 'favoriter' and 'spår-övrigt'
  const validCategories = (Object.keys(MAIN_CATEGORY_DISPLAY) as MainCategoryKey[])
    .filter(key => !['favoriter' as MainCategoryKey, 'spår-övrigt' as MainCategoryKey].includes(key))
    .map(key => ({
      key,
      name: MAIN_CATEGORY_DISPLAY[key].name,
      icon: MAIN_CATEGORY_DISPLAY[key].icon,
      // Get the first subcategory as default category value
      subcategory: MAIN_CATEGORY_DISPLAY[key].subcategories?.[0] || key
    }));

  const handleRecategorize = async () => {
    if (!selectedCategory) {
      toast({
        title: "Välj en kategori",
        description: "Du måste välja en ny kategori för fångsten.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Fetch the current capture
      const { data: capture, error: fetchError } = await supabase
        .from('species_captures')
        .select('ai_analysis')
        .eq('id', captureId)
        .single();

      if (fetchError) throw fetchError;

      // Update the category in ai_analysis
      const currentAnalysis = (capture.ai_analysis || {}) as Record<string, any>;
      const currentSpecies = (currentAnalysis.species || {}) as Record<string, any>;
      
      const updatedAnalysis = {
        ...currentAnalysis,
        species: {
          ...currentSpecies,
          category: selectedCategory
        }
      };

      const { error: updateError } = await supabase
        .from('species_captures')
        .update({ ai_analysis: updatedAnalysis })
        .eq('id', captureId);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ["species-captures"] });

      toast({
        title: "Kategori uppdaterad",
        description: `"${speciesName}" har omkategoriserats till ${selectedCategory}.`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error recategorizing capture:', err);
      toast({
        title: "Kunde inte uppdatera kategori",
        description: err instanceof Error ? err.message : "Ett okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ändra kategori</AlertDialogTitle>
          <AlertDialogDescription>
            Är "{speciesName}" felkategoriserat som "Spår och Övrigt"? 
            Välj rätt kategori nedan för att korrigera klassificeringen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Välj rätt kategori..." />
            </SelectTrigger>
            <SelectContent>
              {validCategories.map(cat => (
                <SelectItem key={cat.key} value={cat.subcategory}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>Avbryt</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRecategorize}
            disabled={!selectedCategory || isUpdating}
          >
            {isUpdating ? "Uppdaterar..." : "Uppdatera kategori"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
