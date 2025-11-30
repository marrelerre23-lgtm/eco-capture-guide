import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle, Camera, MapPin, BookOpen, Award, Wifi, Share2 } from "lucide-react";

const Help = () => {
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
          <h1 className="text-3xl font-bold text-primary">Hjälp & FAQ</h1>
          <p className="text-muted-foreground">
            Svar på vanliga frågor och guider
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Kom igång
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-muted-foreground">
              <p className="font-semibold text-foreground">Så här använder du EcoCapture:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Öppna kameran genom att klicka på kamera-ikonen</li>
                <li>Ta ett tydligt foto av växten, djuret eller svampen</li>
                <li>Vänta medan AI:n analyserar bilden</li>
                <li>Läs informationen noggrant och kontrollera säkerhetsvarningar</li>
                <li>Spara ditt fynd i loggboken med platsmarkering</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Vanliga frågor</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Camera Section */}
              <AccordionItem value="camera-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    <span>Hur tar jag bra bilder för identifiering?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="space-y-2 ml-4">
                    <li>• Använd naturligt ljus och undvik blixt</li>
                    <li>• Ta bilder från olika vinklar (ovanifrån, från sidan, undersidan)</li>
                    <li>• Se till att motivet är i fokus och fyller bilden</li>
                    <li>• Inkludera omgivningen för att visa växplats/habitat</li>
                    <li>• Undvik suddiga eller dåligt belysta bilder</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="camera-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    <span>Kameran fungerar inte på min enhet</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Om kameran inte fungerar:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Kontrollera att du gett appen tillåtelse att använda kameran</li>
                    <li>• Stäng andra appar som kan använda kameran</li>
                    <li>• Starta om appen</li>
                    <li>• Kontrollera att din enhet har en fungerande kamera</li>
                    <li>• Prova att använda en annan webbläsare</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* AI & Accuracy */}
              <AccordionItem value="ai-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Hur tillförlitlig är AI-identifieringen?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">
                    Vår AI är tränad på tusentals bilder och har hög noggrannhet, men den är inte perfekt:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>• Använd alltid AI:n som ett hjälpmedel, inte som enda källa</li>
                    <li>• Konsultera alltid flera källor och en expert vid osäkerhet</li>
                    <li>• Kontrollera flera kännetecken, inte bara bilden</li>
                    <li>• Var extra försiktig med giftig eller ätlig klassificering</li>
                    <li>• Vi tar inget ansvar för felaktiga identifieringar</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Vad gör jag om AI:n identifierar fel?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Om du tror att identifieringen är felaktig:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Ta nya bilder från olika vinklar</li>
                    <li>• Se till att bilden är tydlig och välbelyst</li>
                    <li>• Jämför med beskrivningen i appen</li>
                    <li>• Konsultera en svampexpert eller handbok</li>
                    <li>• Rapportera felet till oss så vi kan förbättra systemet</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Logbook & Map */}
              <AccordionItem value="logbook-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Hur fungerar loggboken?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Loggboken sparar alla dina fynd automatiskt:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Varje fynd sparas med foto, plats, datum och AI-analys</li>
                    <li>• Du kan filtrera och söka bland dina fynd</li>
                    <li>• Markera favoriter för snabb åtkomst</li>
                    <li>• Exportera din data som CSV för analys</li>
                    <li>• All data sparas säkert i molnet</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="map-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Hur använder jag kartan?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Kartan visar alla dina fynd geografiskt:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Klicka på en markör för att se detaljer om fyndet</li>
                    <li>• Zooma in/ut för att se olika områden</li>
                    <li>• Filtrera markörer efter art eller kategori</li>
                    <li>• Din nuvarande position visas automatiskt</li>
                    <li>• Hitta tillbaka till bra svampställen</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Offline & Performance */}
              <AccordionItem value="offline-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span>Kan jag använda appen utan internet?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Ja, appen har offline-stöd:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Du kan ta foton offline</li>
                    <li>• Fynd sparas lokalt och synkas när du är online</li>
                    <li>• Loggboken är tillgänglig offline</li>
                    <li>• AI-analys kräver internetanslutning</li>
                    <li>• Installera appen som PWA för bäst offline-upplevelse</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Achievements */}
              <AccordionItem value="achievements-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Hur låser jag upp badges?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Badges låses upp genom att:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Fånga ett visst antal arter</li>
                    <li>• Upptäcka sällsynta arter</li>
                    <li>• Använda appen regelbundet</li>
                    <li>• Utforska olika kategorier (svamp, bär, etc.)</li>
                    <li>• Se din framgång i profilen</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Sharing */}
              <AccordionItem value="share-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    <span>Hur delar jag mina fynd?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-2">Du kan dela fynd på flera sätt:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Klicka på dela-ikonen på ett fynd i loggboken</li>
                    <li>• Välj social media eller meddelandeapp</li>
                    <li>• Bilden och artinformation inkluderas automatiskt</li>
                    <li>• Du kan också exportera data som CSV</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Safety Notice */}
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-warning mb-2">⚠️ Viktig säkerhetsinformation</h3>
            <p className="text-sm text-muted-foreground">
              Konsumera aldrig växter, svampar eller bär om du inte är 100% säker på identifieringen. AI:n är ett hjälpmedel och ingen garanti. Vid minsta tvivel, kontakta en expert eller lämna det ifred.
            </p>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">
              Hittade du inte svar på din fråga?
            </p>
            <Button onClick={() => navigate('/about')}>
              Kontakta support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;
