import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface AnalysisLoadingStateProps {
  message?: string;
  submessage?: string;
}

export const AnalysisLoadingState = ({ 
  message = "Analyserar bild...",
  submessage = "AI:n identifierar arten åt dig"
}: AnalysisLoadingStateProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <Sparkles className="h-6 w-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold animate-pulse">
                {message}
              </h3>
              <p className="text-sm text-muted-foreground">
                {submessage}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent animate-[shimmer_2s_ease-in-out_infinite]" 
                   style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Detta kan ta några sekunder...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
