import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before and if already installed
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!dismissed && !isInstalled) {
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA installed");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowPrompt(false);
  };

  const handleLearnMore = () => {
    navigate('/install');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Installera EcoCapture</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Snabbare åtkomst och offline-funktioner
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall}>
                Installera
              </Button>
              <Button size="sm" variant="ghost" onClick={handleLearnMore}>
                Läs mer
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Inte nu
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
