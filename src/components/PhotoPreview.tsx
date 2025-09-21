import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PhotoPreviewProps {
  imageUrl: string;
  onRetake: () => void;
}

interface AnalysisResult {
  name: string;
  scientificName: string;
  description: string;
  confidence: number;
  facts: string[];
}

export const PhotoPreview = ({ imageUrl, onRetake }: PhotoPreviewProps) => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResult: AnalysisResult = {
      name: "Blåbärsris",
      scientificName: "Vaccinium myrtillus",
      description: "Blåbärsris är en låg buske som tillhör familjen ljungväxter. Den växer naturligt i barrskogar och på hedar i norra Europa.",
      confidence: 92,
      facts: [
        "Växer naturligt i skandinaviska skogar",
        "Blommar med vita till rosa blommor på våren",
        "Bären mognar under sensommaren",
        "Kan bli upp till 60 cm hög"
      ]
    };
    
    setAnalysisResult(mockResult);
    setIsAnalyzing(false);
  };

  const saveCapture = () => {
    toast.success("Fångst sparad i loggboken!");
    navigate("/logbook");
  };

  const deleteCapture = () => {
    toast.error("Fångst raderad");
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onRetake}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold">Förhandsvisning</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {/* Image */}
        <Card className="overflow-hidden shadow-card">
          <div className="aspect-square">
            <img 
              src={imageUrl} 
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
          </div>
        </Card>

        {/* Analysis Section */}
        {!analysisResult && !isAnalyzing && (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analysera din fångst</h3>
              <p className="text-muted-foreground mb-4">
                Använd AI för att identifiera arten och få detaljerad information
              </p>
              <Button onClick={analyzeImage} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Analysera bild
              </Button>
            </CardContent>
          </Card>
        )}

        {isAnalyzing && (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Analyserar...</h3>
              <p className="text-muted-foreground">
                AI:n undersöker din bild för att identifiera arten
              </p>
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <>
            {/* Analysis Results */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium mb-2">
                    <Sparkles className="h-4 w-4" />
                    {analysisResult.confidence}% säkerhet
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-center mb-1">{analysisResult.name}</h3>
                <p className="text-muted-foreground italic text-center mb-4">{analysisResult.scientificName}</p>
                
                <p className="text-sm text-muted-foreground mb-4">{analysisResult.description}</p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Intressanta fakta:</h4>
                  <ul className="space-y-1">
                    {analysisResult.facts.map((fact, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={deleteCapture}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Radera
              </Button>
              <Button 
                className="flex-1 bg-gradient-eco hover:bg-primary-dark" 
                onClick={saveCapture}
              >
                <Save className="mr-2 h-4 w-4" />
                Spara fångst
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};