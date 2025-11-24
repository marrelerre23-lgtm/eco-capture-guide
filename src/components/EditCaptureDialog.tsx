import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { MAIN_CATEGORY_DISPLAY, MainCategoryKey } from "@/types/species";

interface EditCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNotes: string;
  currentCategory?: string;
  onSave: (notes: string, category?: string) => Promise<void>;
}

export const EditCaptureDialog = ({ open, onOpenChange, currentNotes, currentCategory, onSave }: EditCaptureDialogProps) => {
  const [notes, setNotes] = useState(currentNotes);
  const [category, setCategory] = useState(currentCategory || "");
  const [saving, setSaving] = useState(false);

  // Get all valid categories excluding favorites and spår-övrigt for primary selection
  const validCategories = (Object.keys(MAIN_CATEGORY_DISPLAY) as MainCategoryKey[])
    .filter(key => !['favoriter' as MainCategoryKey].includes(key))
    .map(key => ({
      key,
      name: MAIN_CATEGORY_DISPLAY[key].name,
      icon: MAIN_CATEGORY_DISPLAY[key].icon,
      subcategories: MAIN_CATEGORY_DISPLAY[key].subcategories || []
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes, category !== currentCategory ? category : undefined);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redigera anteckningar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Välj kategori..." />
              </SelectTrigger>
              <SelectContent>
                {validCategories.map(cat => (
                  cat.subcategories.length > 0 ? (
                    cat.subcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>
                        {cat.icon} {cat.name} → {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lägg till dina egna anteckningar här..."
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
