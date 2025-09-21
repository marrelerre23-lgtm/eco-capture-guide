import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
}

export const SpeciesModal = ({ species, isOpen, onClose }: SpeciesModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-0 bg-background">
        {/* Header */}
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{species.name}</h2>
              <p className="text-sm text-muted-foreground italic">{species.scientificName}</p>
              <p className="text-xs text-muted-foreground">{species.dateFound}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-secondary/50 hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* Image */}
          <div className="aspect-square mx-4 rounded-lg overflow-hidden">
            <img 
              src={species.image}
              alt={species.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div className="px-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {species.description}
            </p>
          </div>

          {/* Facts */}
          <div className="px-4 pb-4 space-y-4">
            {species.facts.map((fact, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{fact.icon}</span>
                  <h4 className="font-medium text-primary">{fact.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                  {fact.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};