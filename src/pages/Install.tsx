import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Check, Smartphone, Zap, Wifi, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installera via webbläsaren",
        description: "Använd webbläsarens meny för att installera appen.",
      });
      return;
    }

    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
      toast({
        title: "Installerad! 🎉",
        description: "EcoCapture är nu installerad på din enhet.",
      });
    }
    
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const features = [
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Native känsla",
      description: "Appen känns som en riktig mobilapp"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Snabbare laddning",
      description: "Öppnas direkt från din hemskärm"
    },
    {
      icon: <Wifi className="h-6 w-6" />,
      title: "Offline-funktioner",
      description: "Fungerar även utan internetanslutning"
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Full kameraåtkomst",
      description: "Smidigare att ta bilder och analysera"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background pb-20 pt-16">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Installera EcoCapture</h1>
          <p className="text-muted-foreground">
            Få en bättre upplevelse genom att installera appen på din enhet
          </p>
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-6">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-primary/10 p-2">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Appen är installerad</h3>
                <p className="text-sm text-muted-foreground">
                  EcoCapture är redan installerad på din enhet
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleInstall}
                disabled={isInstalling}
              >
                <Download className="h-5 w-5 mr-2" />
                {isInstalling ? "Installerar..." : "Installera nu"}
              </Button>
              
              {!deferredPrompt && (
                <div className="text-sm text-muted-foreground text-center space-y-2">
                  <p>Installationsprompt inte tillgänglig?</p>
                  <details className="text-left bg-muted/50 p-3 rounded-lg">
                    <summary className="cursor-pointer font-medium">
                      Manuell installation
                    </summary>
                    <div className="mt-2 space-y-2 text-xs">
                      <p><strong>iPhone/iPad (Safari):</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Tryck på delningsknappen (↑)</li>
                        <li>Välj "Lägg till på hemskärmen"</li>
                        <li>Tryck på "Lägg till"</li>
                      </ol>
                      <p className="mt-3"><strong>Android (Chrome):</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Öppna webbläsarens meny (⋮)</li>
                        <li>Välj "Installera app" eller "Lägg till på hemskärmen"</li>
                        <li>Tryck på "Installera"</li>
                      </ol>
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-center">Fördelar med installation</h2>
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            {isInstalled ? "Tillbaka till appen" : "Fortsätt i webbläsaren"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InstallWithErrorBoundary() {
  return (
    <RouteErrorBoundary routeName="Install">
      <Install />
    </RouteErrorBoundary>
  );
}
