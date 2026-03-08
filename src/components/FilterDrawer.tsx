import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({ title, open, onOpenChange, children }: CollapsibleSectionProps) => (
  <div>
    <button
      onClick={() => onOpenChange(!open)}
      className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
    >
      <span className="font-medium">{title}</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="pt-3 space-y-2">{children}</div>}
  </div>
);

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gpsAccuracyFilter: string;
  onGpsAccuracyChange: (value: string) => void;
  subcategoryFilter: Record<string, string>;
  onSubcategoryChange: (category: string, value: string) => void;
  availableSubcategories?: { category: string; subcategories: string[]; counts: Record<string, number> }[];
  onClearAll: () => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  gpsAccuracyFilter,
  onGpsAccuracyChange,
  subcategoryFilter,
  onSubcategoryChange,
  availableSubcategories,
  onClearAll,
}: FilterDrawerProps) {
  const [gpsOpen, setGpsOpen] = useState(true);
  const [subcatOpen, setSubcatOpen] = useState(true);

  const hasActiveFilters = gpsAccuracyFilter || Object.values(subcategoryFilter).some(v => v);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>
            Filtrera dina fångster efter ätlighet, GPS-noggrannhet och kategori
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearAll} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Rensa alla filter
            </Button>
          )}

          {showEdibilityFilter && (
            <CollapsibleSection title="Ätlighet" open={edibilityOpen} onOpenChange={setEdibilityOpen}>
              <Button variant={!edibilityFilter ? "default" : "outline"} size="sm" onClick={() => onEdibilityChange("")} className="w-full justify-start">Alla</Button>
              <Button variant={edibilityFilter === "ätlig" ? "default" : "outline"} size="sm" onClick={() => onEdibilityChange("ätlig")} className={`w-full justify-start ${edibilityFilter === "ätlig" ? "bg-green-600 hover:bg-green-700" : ""}`}>✓ Ätlig</Button>
              <Button variant={edibilityFilter === "giftig" ? "default" : "outline"} size="sm" onClick={() => onEdibilityChange("giftig")} className={`w-full justify-start ${edibilityFilter === "giftig" ? "bg-red-600 hover:bg-red-700" : ""}`}>⚠ Giftig</Button>
              <Button variant={edibilityFilter === "inte-ätlig" ? "default" : "outline"} size="sm" onClick={() => onEdibilityChange("inte-ätlig")} className={`w-full justify-start ${edibilityFilter === "inte-ätlig" ? "bg-gray-600 hover:bg-gray-700" : ""}`}>⊘ Inte ätlig</Button>
              <Button variant={edibilityFilter === "okänd" ? "default" : "outline"} size="sm" onClick={() => onEdibilityChange("okänd")} className="w-full justify-start">? Okänd</Button>
            </CollapsibleSection>
          )}

          <CollapsibleSection title="GPS-noggrannhet" open={gpsOpen} onOpenChange={setGpsOpen}>
            <Button variant={!gpsAccuracyFilter ? "default" : "outline"} size="sm" onClick={() => onGpsAccuracyChange("")} className="w-full justify-start">Alla</Button>
            <Button variant={gpsAccuracyFilter === "high" ? "default" : "outline"} size="sm" onClick={() => onGpsAccuracyChange("high")} className={`w-full justify-start ${gpsAccuracyFilter === "high" ? "bg-green-600 hover:bg-green-700" : ""}`}>📍 Hög (≤50m)</Button>
            <Button variant={gpsAccuracyFilter === "medium" ? "default" : "outline"} size="sm" onClick={() => onGpsAccuracyChange("medium")} className={`w-full justify-start ${gpsAccuracyFilter === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}>📌 Medel (50-100m)</Button>
            <Button variant={gpsAccuracyFilter === "low" ? "default" : "outline"} size="sm" onClick={() => onGpsAccuracyChange("low")} className={`w-full justify-start ${gpsAccuracyFilter === "low" ? "bg-red-600 hover:bg-red-700" : ""}`}>📍 Låg (&gt;100m)</Button>
          </CollapsibleSection>

          {availableSubcategories && availableSubcategories.length > 0 && (
            <CollapsibleSection title="Underkategorier" open={subcatOpen} onOpenChange={setSubcatOpen}>
              {availableSubcategories.map(({ category, subcategories, counts }) => (
                <div key={category} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground px-1">{category}</div>
                  <div className="space-y-1">
                    {subcategories.map(subcat => (
                      <Button key={subcat} variant={subcategoryFilter[category] === subcat ? "default" : "outline"} size="sm" onClick={() => onSubcategoryChange(category, subcat)} className="w-full justify-between">
                        <span>{subcat}</span>
                        <span className="text-xs opacity-70">({counts[subcat] || 0})</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
