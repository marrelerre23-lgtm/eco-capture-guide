import React from "react";
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
  isDeleting?: boolean;
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
  isDeleting = false,
  showActions = false 
}: SpeciesModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[90vw] sm:max-w-md max-h-[85vh] flex flex-col p-0 border-0 rounded-2xl shadow-2xl" 
        style={{ 
          backgroundColor: '#fefdfb',
          backgroundImage: 'none'
        }}
      >
        {/* Close Button */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ color: '#2d3e2d' }}>
          <div className="space-y-0">
            {/* Header with title and date */}
            <div className="px-6 pt-8 pb-4 space-y-1">
              <h2 className="text-2xl font-bold pr-8" style={{ color: '#1a2a1a' }}>{species.name}</h2>
              <p className="text-sm italic pr-8" style={{ color: '#5a6a5a' }}>{species.scientificName} | {species.dateFound}</p>
            </div>

            {/* Image - with padding and rounded corners */}
            <div className="px-6">
              <img 
                src={species.image}
                alt={species.name}
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="px-6 py-4">
              <p className="text-sm leading-relaxed" style={{ color: '#2d3e2d' }}>
                {species.description}
              </p>
            </div>

            {/* Facts - structured with dividers */}
            <div className="px-6 pb-6 space-y-0">
              {species.facts.map((fact, index) => (
                <div key={index}>
                  {index > 0 && <div className="border-t my-4" style={{ borderColor: '#d4dcd4' }} />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{fact.icon}</span>
                      <h4 className="font-semibold text-sm" style={{ color: '#2e7d5e' }}>{fact.title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#3d4d3d' }}>
                      {fact.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        {showActions && (
          <div className="flex-shrink-0 px-4 pb-4 space-y-2 border-t pt-4" style={{ borderColor: '#d4dcd4' }}>
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
            {onDelete && (
              <Button 
                onClick={onDelete} 
                variant="destructive" 
                className="w-full"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeleting ? "Tar bort..." : "Ta bort fångst"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};