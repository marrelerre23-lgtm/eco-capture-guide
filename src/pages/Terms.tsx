import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
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
          <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
            <FileText className="h-8 w-8" />
            Användarvillkor
          </h1>
          <p className="text-muted-foreground text-sm">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Godkännande av villkor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Välkommen till Svampjakten. Genom att registrera dig och använda denna tjänst godkänner du dessa användarvillkor i sin helhet. Om du inte godkänner villkoren ska du inte använda tjänsten.
            </p>
            <p>
              Vi förbehåller oss rätten att när som helst uppdatera dessa villkor. Fortsatt användning efter ändringar innebär att du godkänner de nya villkoren.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Tjänstebeskrivning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Svampjakten är en digital tjänst för identifiering, dokumentation och delning av svamp- och bärfynd. Tjänsten använder AI-teknologi för att analysera bilder och ge information om olika arter.
            </p>
            <p className="font-semibold text-foreground">Tjänsten inkluderar:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>AI-baserad bildanalys och artidentifiering</li>
              <li>Digital loggbok för dokumentation av fynd</li>
              <li>Kartfunktion med GPS-platsmarkering</li>
              <li>Statistik och prestationsbadges</li>
              <li>Delningsfunktioner för sociala medier</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Användaransvar och säkerhet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p className="font-semibold text-warning">
              ⚠️ VIKTIG INFORMATION OM SÄKERHET
            </p>
            <p>
              AI-identifieringen är ett hjälpmedel och ingen garanti. Du ansvarar själv för att säkerställa korrekt identifiering innan du konsumerar någon svamp eller bär.
            </p>
            <p className="font-semibold text-foreground">Som användare förbinder du dig att:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Aldrig förlita dig enbart på AI:ns identifiering</li>
              <li>Alltid konsultera flera källor och experter vid osäkerhet</li>
              <li>Inte konsumera svamp eller bär om du inte är 100% säker</li>
              <li>Ta fullt ansvar för dina egna handlingar och beslut</li>
              <li>Inte använda tjänsten för att ge råd till andra om ätlighet</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Ansvarsbegränsning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p className="font-semibold text-foreground">
              Svampjakten och dess ägare ansvarar INTE för:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Felaktiga AI-identifieringar eller annan information i appen</li>
              <li>Förgiftning, sjukdom eller skada till följd av konsumtion av svamp eller bär</li>
              <li>Förlust av data eller innehåll</li>
              <li>Tekniska problem, avbrott eller fel i tjänsten</li>
              <li>Skador som uppstår vid användning av tjänsten</li>
              <li>Tredje parts innehåll eller handlingar</li>
            </ul>
            <p className="mt-3 font-semibold text-warning">
              Tjänsten tillhandahålls "som den är" utan några garantier av något slag.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Användarkonto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>För att använda tjänsten måste du skapa ett konto. Du förbinder dig att:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Ange korrekt och aktuell information</li>
              <li>Hålla ditt lösenord säkert och konfidentiellt</li>
              <li>Inte dela ditt konto med andra</li>
              <li>Omedelbart meddela oss om obehörig åtkomst</li>
              <li>Vara minst 13 år gammal (eller ha vårdnadshavares tillstånd)</li>
            </ul>
            <p className="mt-3">
              Du är ansvarig för all aktivitet som sker under ditt konto.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Användargenererat innehåll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              När du laddar upp foton och skapar innehåll i appen behåller du äganderätten till ditt innehåll, men du ger oss en licens att:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Lagra och bearbeta ditt innehåll för att tillhandahålla tjänsten</li>
              <li>Använda bilder för att förbättra AI-modellen (anonymiserat)</li>
              <li>Visa ditt innehåll om du väljer att dela det</li>
            </ul>
            <p className="mt-3 font-semibold text-foreground">
              Du förbinder dig att inte ladda upp innehåll som:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Bryter mot lagar eller andras rättigheter</li>
              <li>Är stötande, olagligt eller olämpligt</li>
              <li>Innehåller skadlig kod eller virus</li>
              <li>Inkräktar på andras integritet</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Immateriella rättigheter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Allt innehåll i tjänsten (design, logotyper, text, kod, AI-modeller) ägs av Svampjakten och är skyddat av upphovsrätt och andra immateriella rättigheter.
            </p>
            <p>
              Du får inte kopiera, modifiera, distribuera eller sälja någon del av tjänsten utan vårt skriftliga godkännande.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Förbjuden användning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Du får inte:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Använda tjänsten för olagliga ändamål</li>
              <li>Försöka få obehörig åtkomst till systemet</li>
              <li>Störa eller skada tjänstens funktionalitet</li>
              <li>Använda automatiserade verktyg för att skrapa data</li>
              <li>Missbruka eller överbelasta systemet</li>
              <li>Utge dig för att vara någon annan</li>
              <li>Trakassera eller hota andra användare</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Priser och betalning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Tjänsten är för närvarande kostnadsfri att använda. Vi förbehåller oss rätten att i framtiden introducera betalda funktioner eller prenumerationer.
            </p>
            <p>
              Om betalda funktioner införs kommer du att informeras och få möjlighet att acceptera nya villkor innan du använder dessa funktioner.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Uppsägning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Du kan när som helst avsluta ditt konto genom att kontakta oss eller radera det i appens inställningar.
            </p>
            <p>
              Vi förbehåller oss rätten att stänga av eller ta bort konton som bryter mot dessa villkor, utan förvarning eller ersättning.
            </p>
            <p>
              Vid uppsägning kommer dina personuppgifter att raderas i enlighet med vår integritetspolicy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Tillgänglighet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vi strävar efter att hålla tjänsten tillgänglig dygnet runt, men kan inte garantera 100% drifttid. Tjänsten kan vara otillgänglig för underhåll, uppgraderingar eller av andra tekniska skäl.
            </p>
            <p>
              Vi ansvarar inte för skador eller förluster som uppstår på grund av att tjänsten är otillgänglig.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Ändringar i tjänsten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vi förbehåller oss rätten att när som helst:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Ändra, lägga till eller ta bort funktioner</li>
              <li>Uppdatera AI-modeller och algoritmer</li>
              <li>Ändra gränssnittet eller designen</li>
              <li>Avsluta tjänsten helt</li>
            </ul>
            <p className="mt-3">
              Vi kommer att göra vårt bästa för att informera om väsentliga ändringar i förväg.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Tredje parts tjänster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Tjänsten använder tredje parts tjänster som:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Supabase för databas och autentisering</li>
              <li>Google Gemini AI för bildanalys</li>
              <li>Cloudflare för hosting</li>
              <li>Leaflet/OpenStreetMap för kartor</li>
            </ul>
            <p className="mt-3">
              Dessa tjänster har sina egna användarvillkor och integritetspolicyer som du också är bunden av.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Force majeure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vi ansvarar inte för förseningar eller fel i tjänsten som beror på omständigheter utanför vår kontroll, såsom naturkatastrofer, krig, terrorattentat, cyberattacker, strömavbrott eller myndighetsbeslut.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>15. Tillämplig lag och tvister</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Dessa villkor regleras av svensk lag. Eventuella tvister ska i första hand lösas genom förhandling. Om överenskommelse inte kan nås ska tvisten avgöras av svensk domstol.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>16. Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Om du har frågor om dessa användarvillkor, kontakta oss:
            </p>
            <p className="text-sm">
              E-post: info@svampjakten.se<br />
              Eller via profilen i appen
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <p className="font-semibold text-warning mb-2">
              ⚠️ Sammanfattning av viktigaste punkterna:
            </p>
            <ul className="list-disc ml-4 space-y-2 text-sm text-muted-foreground">
              <li>AI-identifieringen är ett hjälpmedel, inte en garanti</li>
              <li>Du ansvarar själv för att säkerställa korrekt identifiering</li>
              <li>Vi tar inget ansvar för felaktiga identifieringar eller skador</li>
              <li>Konsumera aldrig svamp/bär om du inte är 100% säker</li>
              <li>Följ användarvillkoren och var en ansvarsfull användare</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Dessa användarvillkor gäller från {new Date().toLocaleDateString('sv-SE')}</p>
          <p className="mt-2">Genom att använda Svampjakten godkänner du dessa villkor</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
