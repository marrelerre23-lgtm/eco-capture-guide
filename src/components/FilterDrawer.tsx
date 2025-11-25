import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Edibility filter
  edibilityFilter: string;
  onEdibilityChange: (value: string) => void;
  showEdibilityFilter: boolean;
  
  // GPS accuracy filter
  gpsAccuracyFilter: string;
  onGpsAccuracyChange: (value: string) => void;
  
  // Subcategory filter
  subcategoryFilter: Record<string, string>;
  onSubcategoryChange: (category: string, value: string) => void;
  availableSubcategories?: { category: string; subcategories: string[]; counts: Record<string, number> }[];
  
  // Clear all filters
  onClearAll: () => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  edibilityFilter,
  onEdibilityChange,
  showEdibilityFilter,
  gpsAccuracyFilter,
  onGpsAccuracyChange,
  subcategoryFilter,
  onSubcategoryChange,
  availableSubcategories,
  onClearAll,
}: FilterDrawerProps) {
  const [edibilityOpen, setEdibilityOpen] = useState(true);
  const [gpsOpen, setGpsOpen] = useState(true);
  const [subcatOpen, setSubcatOpen] = useState(true);

  const hasActiveFilters = edibilityFilter || gpsAccuracyFilter || Object.values(subcategoryFilter).some(v => v);

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
          {/* Clear all button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Rensa alla filter
            </Button>
          )}

          {/* Edibility Filter */}
          {showEdibilityFilter && (
            <Collapsible open={edibilityOpen} onOpenChange={setEdibilityOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium">Ätlighet</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${edibilityOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-2">
                <Button
                  variant={!edibilityFilter ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdibilityChange("")}
                  className="w-full justify-start"
                >
                  Alla
                </Button>
                <Button
                  variant={edibilityFilter === "ätlig" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdibilityChange("ätlig")}
                  className={`w-full justify-start ${edibilityFilter === "ätlig" ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  ✓ Ätlig
                </Button>
                <Button
                  variant={edibilityFilter === "giftig" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdibilityChange("giftig")}
                  className={`w-full justify-start ${edibilityFilter === "giftig" ? "bg-red-600 hover:bg-red-700" : ""}`}
                >
                  ⚠ Giftig
                </Button>
                <Button
                  variant={edibilityFilter === "inte-ätlig" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdibilityChange("inte-ätlig")}
                  className={`w-full justify-start ${edibilityFilter === "inte-ätlig" ? "bg-gray-600 hover:bg-gray-700" : ""}`}
                >
                  ⊘ Inte ätlig
                </Button>
                <Button
                  variant={edibilityFilter === "okänd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onEdibilityChange("okänd")}
                  className="w-full justify-start"
                >
                  ? Okänd
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* GPS Accuracy Filter */}
          <Collapsible open={gpsOpen} onOpenChange={setGpsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
              <span className="font-medium">GPS-noggrannhet</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${gpsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-2">
              <Button
                variant={!gpsAccuracyFilter ? "default" : "outline"}
                size="sm"
                onClick={() => onGpsAccuracyChange("")}
                className="w-full justify-start"
              >
                Alla
              </Button>
              <Button
                variant={gpsAccuracyFilter === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => onGpsAccuracyChange("high")}
                className={`w-full justify-start ${gpsAccuracyFilter === "high" ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                📍 Hög (≤50m)
              </Button>
              <Button
                variant={gpsAccuracyFilter === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => onGpsAccuracyChange("medium")}
                className={`w-full justify-start ${gpsAccuracyFilter === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""}`}
              >
                📌 Medel (50-100m)
              </Button>
              <Button
                variant={gpsAccuracyFilter === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => onGpsAccuracyChange("low")}
                className={`w-full justify-start ${gpsAccuracyFilter === "low" ? "bg-red-600 hover:bg-red-700" : ""}`}
              >
                📍 Låg (&gt;100m)
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Subcategory Filters */}
          {availableSubcategories && availableSubcategories.length > 0 && (
            <Collapsible open={subcatOpen} onOpenChange={setSubcatOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium">Underkategorier</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${subcatOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-4">
                {availableSubcategories.map(({ category, subcategories, counts }) => (
                  <div key={category} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground px-1">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {subcategories.map(subcat => (
                        <Button
                          key={subcat}
                          variant={subcategoryFilter[category] === subcat ? "default" : "outline"}
                          size="sm"
                          onClick={() => onSubcategoryChange(category, subcat)}
                          className="w-full justify-between"
                        >
                          <span>{subcat}</span>
                          <span className="text-xs opacity-70">({counts[subcat] || 0})</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
