import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: string;
  description: string;
  facts: {
    icon: string;
    title: string;
    description: string;
  }[];
}

interface SpeciesModalProps {
  species: Species;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isAnalyzing?: boolean;
  showActions?: boolean;
}

export const SpeciesModal = ({ 
  species, 
  isOpen, 
  onClose, 
  onAnalyze, 
  onSave, 
  onDelete, 
  isAnalyzing = false,
  showActions = false 
}: SpeciesModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-0 bg-accent/30">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-accent/80 hover:bg-accent shadow-md"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-0">
          {/* Header with title and date */}
          <div className="px-6 pt-6 pb-4 space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{species.name}</h2>
            <p className="text-sm text-muted-foreground italic">{species.scientificName} | {species.dateFound}</p>
          </div>

          {/* Image */}
          <div className="px-6">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img 
                src={species.image}
                alt={species.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4">
            <p className="text-sm text-foreground leading-relaxed">
              {species.description}
            </p>
          </div>

          {/* Facts - structured with dividers */}
          <div className="px-6 pb-6 space-y-0">
            {species.facts.map((fact, index) => (
              <div key={index}>
                {index > 0 && <div className="border-t border-border my-4" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{fact.icon}</span>
                    <h4 className="font-semibold text-primary text-sm">{fact.title}</h4>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {fact.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="px-4 pb-4 space-y-2">
              {onAnalyze && (
                <Button 
                  onClick={onAnalyze} 
                  className="w-full"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isAnalyzing ? "Analyserar..." : "Analysera med AI"}
                </Button>
              )}
              {onSave && (
                <Button onClick={onSave} variant="outline" className="w-full">
                  Spara fångst
                </Button>
              )}
              {onDelete && (
                <Button onClick={onDelete} variant="destructive" className="w-full">
                  Ta bort
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};