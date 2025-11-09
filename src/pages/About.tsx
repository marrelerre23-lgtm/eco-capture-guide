import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf, Camera, Brain, Globe, Shield, Sparkles } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-primary">Om Svampjakten</h1>
          <p className="text-muted-foreground">
            Din digitala guide för svamp- och bäridentifiering
          </p>
        </div>

        {/* Mission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Vår Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Svampjakten gör det enkelt och säkert att upptäcka, identifiera och dokumentera svamp och bär i naturen. Oavsett om du är nybörjare eller erfaren svampplockare hjälper vår app dig att lära dig mer om naturens rikedom.
            </p>
            <p>
              Vi tror på att göra naturkunskap tillgänglig för alla och bidra till en säkrare och roligare upplevelse i skogen.
            </p>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Hur det Fungerar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Ta ett foto</h4>
                  <p className="text-sm text-muted-foreground">
                    Använd kameran för att ta en tydlig bild av svampen eller bäret från olika vinklar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">AI-analys</h4>
                  <p className="text-sm text-muted-foreground">
                    Vår AI analyserar bilden och jämför den med tusentals arter i vår databas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Få information</h4>
                  <p className="text-sm text-muted-foreground">
                    Se detaljerad information om arten, ätlighet, eventuella riskfaktorer och tips.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Spara & Dela</h4>
                  <p className="text-sm text-muted-foreground">
                    Dokumentera dina fynd i loggboken och dela med vänner och familj.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Technology */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI-teknologi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vår app använder avancerad AI-teknologi baserad på Google Gemini för att analysera bilder och identifiera arter. Systemet har tränats på tusentals bilder och fortsätter att lära sig.
            </p>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-4">
              <p className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Viktigt att veta
              </p>
              <p className="text-sm text-muted-foreground">
                AI-analysen är ett hjälpmedel och ingen garanti. Konsultera alltid flera källor och en expert innan du konsumerar okända svampar eller bär. Vi tar inget ansvar för felaktiga identifieringar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Funktioner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Realtids AI-identifiering med kamera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Detaljerad artinformation och säkerhetsvarningar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Personlig loggbok med GPS-platsmarkering</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Interaktiv karta över dina fynd</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Statistik och prestationsbadges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Offline-stöd för användning i skogen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Delningsfunktion för sociala medier</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Kontakt
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p className="mb-2">
              Har du frågor, feedback eller förslag? Vi vill gärna höra från dig!
            </p>
            <p className="text-sm">
              E-post: <span className="text-primary">info@svampjakten.se</span>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Version 1.0.0 • © 2025 Svampjakten
        </p>
      </div>
    </div>
  );
};

export default About;
