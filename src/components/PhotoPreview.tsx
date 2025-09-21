import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
  onSave?: (imageUrl: string, analysisData: any) => void;
  uploading?: boolean;
}

export const PhotoPreview = ({ imageUrl, onRetake, onSave, uploading = false }: PhotoPreviewProps) => {
  const navigate = useNavigate();

  // Mock AI analysis - will be replaced with real AI integration later
  const handleAnalyze = () => {
    if (onSave) {
      const mockAnalysisData = {
        species: "Flugsvamp",
        scientificName: "Amanita muscaria",
        category: "mushroom",
        confidence: 0.85,
        description: "En ikonisk röd svamp med vita prickar. Mycket giftig men också en av världens mest kända svampar.",
        habitat: "Barrskog, särskilt under björk och gran",
        facts: [
          {
            icon: "🍄",
            title: "Giftighet",
            description: "Mycket giftig - ej ätbar! Innehåller muscimol och ibotensyra som kan orsaka allvarliga förgiftningssymptom."
          },
          {
            icon: "🌲",
            title: "Habitat",
            description: "Växer symbiotiskt med barrträd, främst gran och björk. Vanlig i svenska skogar under sommaren och hösten."
          },
          {
            icon: "🔍",
            title: "Igenkänning",
            description: "Röd hatt med karakteristiska vita prickar, vit fot med ring. Kan bli upp till 20cm i diameter."
          }
        ]
      };

      onSave(imageUrl, mockAnalysisData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Photo Preview */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt="Captured" 
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        <div className="space-y-4">
          {/* Analyze Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white py-3"
            onClick={handleAnalyze}
            disabled={uploading}
          >
            {uploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {uploading ? "Sparar..." : "Analysera med AI"}
          </Button>
          
          {/* Secondary Actions */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 bg-black/50 border-white/20 text-white hover:bg-black/70"
              onClick={onRetake}
              disabled={uploading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Ta om
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};