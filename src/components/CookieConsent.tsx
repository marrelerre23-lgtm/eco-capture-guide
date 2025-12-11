import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    console.log('📊 Cookies accepted');
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    console.log('🚫 Cookies declined');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-primary/20 bg-card shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-primary shrink-0 mt-1" />
            
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-base">Vi använder cookies och visar annonser</h3>
                <p className="text-sm text-muted-foreground">
                  Vi använder cookies för att förbättra din upplevelse, analysera trafik och 
                  personalisera innehåll. För gratisanvändare visas annonser via Google AdMob, som kan 
                  använda cookies för att visa relevanta annonser. Genom att fortsätta använda vår tjänst 
                  godkänner du vår användning av cookies och annonser enligt{' '}
                  <a href="/privacy" className="text-primary underline hover:no-underline">
                    integritetspolicy
                  </a>
                  .
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAccept} size="sm" className="flex-1">
                  Acceptera alla
                </Button>
                <Button 
                  onClick={handleDecline} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  Endast nödvändiga
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleDecline}
              aria-label="Stäng cookie-meddelande"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
