import React, { useState, useEffect } from "react";
import { Loader2, Brain, Sparkles, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { TopNavigation } from "./TopNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AdDisplay } from "./AdDisplay";

interface AnalyzingScreenProps {
  category: string;
  detailLevel: string;
  onCancel: () => void;
  isFreeUser?: boolean;
}

const AI_TIPS = [
  "AI:n analyserar bildens färger och texturer...",
  "Jämför med tusentals kända arter...",
  "Identifierar unika kännetecken...",
  "Kontrollerar habitat och geografisk spridning...",
  "Bedömer säkerheten i identifieringen...",
];

const FUN_FACTS = [
  "Det finns över 390,000 kända växtarter i världen",
  "Svampar är närmare besläktade med djur än växter",
  "Vissa mossor kan överleva i rymden",
  "Sveriges äldsta träd är över 9,500 år gammalt",
  "Det finns fler träd på jorden än stjärnor i Vintergatan",
];

export const AnalyzingScreen = ({ category, detailLevel, onCancel, isFreeUser = false }: AnalyzingScreenProps) => {
  const navigate = useNavigate();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAd, setShowAd] = useState(isFreeUser);
  const [adCompleted, setAdCompleted] = useState(!isFreeUser);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    // Rotate tips every 2 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % AI_TIPS.length);
    }, 2000);

    // Rotate facts every 5 seconds
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 5000);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => {
      clearInterval(tipInterval);
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const getEstimatedTime = () => {
    switch (detailLevel) {
      case "quick": return "~5";
      case "deep": return "~20";
      default: return "~10";
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    setAdCompleted(true);
  };

  // Don't show analyzing screen until ad is completed
  if (showAd && !adCompleted) {
    return <AdDisplay onAdComplete={handleAdComplete} />;
  }

  return (
    <>
      <TopNavigation user={user} onLogout={handleLogout} />
      
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary/20 via-background to-accent/20 backdrop-blur-sm flex items-center justify-center p-6 pt-24">
        {/* Cancel Button */}
        <div className="absolute top-20 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCancelDialog(true)}
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
            title="Avbryt analys"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative max-w-md w-full space-y-8 text-center">
        {/* AI Brain Animation */}
        <div className="relative flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: "0.5s" }}>
              <div className="w-40 h-40 rounded-full border-4 border-accent/20 animate-ping" />
            </div>
            
            {/* Central brain icon */}
            <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-white animate-pulse" />
            </div>
            
            {/* Orbiting sparkles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
              <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-primary" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDelay: "0.5s" }}>
              <Search className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 text-accent" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI analyserar din {category}
          </h2>
          <p className="text-muted-foreground">
            Beräknad tid: {getEstimatedTime()} sekunder
          </p>
        </div>

        {/* Current Tip */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border shadow-xl min-h-[100px] flex items-center justify-center">
          <div className="flex items-start gap-3 animate-fade-in">
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
            <p className="text-foreground font-medium text-left">
              {AI_TIPS[currentTipIndex]}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% klart
          </p>
        </div>

        {/* Fun Fact */}
        <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
          <div className="flex items-start gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-xs font-semibold text-accent mb-1">Visste du att...</p>
              <p className="text-sm text-foreground">
                {FUN_FACTS[currentFactIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Cancel Confirmation Dialog */}
    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Avbryt AI-analys?</AlertDialogTitle>
          <AlertDialogDescription>
            Analysen är {Math.round(progress)}% klar. Om du avbryter nu går arbetet förlorat och du måste starta om från början.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Fortsätt analys</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Avbryt analys
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
