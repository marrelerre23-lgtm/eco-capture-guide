import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
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
            <Shield className="h-8 w-8" />
            Integritetspolicy
          </h1>
          <p className="text-muted-foreground text-sm">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Inledning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Välkommen till Svampjakten. Vi värnar om din integritet och är ålagda enligt GDPR att informera dig om hur vi samlar in, använder och skyddar dina personuppgifter.
            </p>
            <p>
              Genom att använda vår tjänst godkänner du villkoren i denna integritetspolicy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Personuppgiftsansvarig</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Svampjakten är personuppgiftsansvarig för behandlingen av dina personuppgifter.
            </p>
            <p className="text-sm">
              Kontaktuppgifter:<br />
              E-post: info@svampjakten.se<br />
              Organisationsnummer: [Lägg till organisationsnummer]
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Vilka uppgifter samlar vi in?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p className="font-semibold text-foreground">Vi samlar in följande typer av uppgifter:</p>
            
            <div className="space-y-4 ml-4">
              <div>
                <p className="font-semibold text-foreground">3.1 Kontoinformation</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>E-postadress</li>
                  <li>Visningsnamn (valfritt)</li>
                  <li>Profilbild (valfritt)</li>
                  <li>Lösenord (krypterat)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground">3.2 Användningsdata</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>Datum och tid för användaraktivitet</li>
                  <li>IP-adress och enhetstyp</li>
                  <li>Webbläsartyp och inställningar</li>
                  <li>Användarstatistik och preferenser</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground">3.3 Innehållsdata</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>Foton av svamp och bär</li>
                  <li>GPS-koordinater (om du ger tillåtelse)</li>
                  <li>Anteckningar och kommentarer</li>
                  <li>Favoritmarkeringar</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground">3.4 AI-analysdata</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>Bilder som skickas för analys</li>
                  <li>AI-genererade identifieringar och beskrivningar</li>
                  <li>Analyshistorik</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Hur använder vi dina uppgifter?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Vi använder dina personuppgifter för att:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Tillhandahålla och förbättra vår tjänst</li>
              <li>Identifiera svamp och bär med AI-teknologi</li>
              <li>Spara och organisera dina fynd i loggboken</li>
              <li>Visa dina fynd på kartan</li>
              <li>Generera statistik och prestationsbadges</li>
              <li>Skicka viktiga meddelanden om tjänsten</li>
              <li>Förbättra säkerhet och förhindra missbruk</li>
              <li>Uppfylla rättsliga förpliktelser</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Rättslig grund för behandling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Vi behandlar dina personuppgifter baserat på:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li><strong>Fullgörande av avtal</strong>: För att tillhandahålla tjänsten du registrerat dig för</li>
              <li><strong>Samtycke</strong>: För platsdata, push-notifikationer och marknadsföring</li>
              <li><strong>Berättigat intresse</strong>: För att förbättra tjänsten och säkerhet</li>
              <li><strong>Rättslig förpliktelse</strong>: För att uppfylla lagkrav</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Delning av uppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Vi delar dina uppgifter med:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li><strong>Supabase</strong>: Vår leverantör för databas och autentisering</li>
              <li><strong>Google Gemini AI</strong>: För bildanalys och artidentifiering</li>
              <li><strong>Cloudflare</strong>: För säker hosting och CDN</li>
            </ul>
            <p className="mt-3">
              Vi säljer aldrig dina personuppgifter till tredje part. Delning sker endast med leverantörer som är nödvändiga för tjänsten och som följer GDPR.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Datalagring och säkerhet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Dina uppgifter lagras säkert med kryptering både under överföring och vid lagring. Vi använder branschstandard för säkerhet inklusive:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>SSL/TLS-kryptering för all datakommunikation</li>
              <li>Bcrypt-hashning av lösenord</li>
              <li>Regelbundna säkerhetsuppdateringar</li>
              <li>Begränsad åtkomst till personuppgifter</li>
            </ul>
            <p className="mt-3">
              Data lagras inom EU/EES i enlighet med GDPR.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Dina rättigheter enligt GDPR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>Du har rätt att:</p>
            <ul className="list-disc ml-4 space-y-2">
              <li><strong>Tillgång</strong>: Få en kopia av dina lagrade uppgifter</li>
              <li><strong>Rättelse</strong>: Korrigera felaktiga uppgifter</li>
              <li><strong>Radering</strong>: Begära att vi raderar dina uppgifter</li>
              <li><strong>Begränsning</strong>: Begränsa behandlingen av dina uppgifter</li>
              <li><strong>Dataportabilitet</strong>: Få dina uppgifter i ett maskinläsbart format</li>
              <li><strong>Invändning</strong>: Invända mot viss typ av behandling</li>
              <li><strong>Återkalla samtycke</strong>: När som helst återkalla lämnat samtycke</li>
            </ul>
            <p className="mt-3">
              För att utöva dina rättigheter, kontakta oss på info@svampjakten.se
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Cookies och spårning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vi använder cookies och lokal lagring för att:
            </p>
            <ul className="list-disc ml-4 space-y-2">
              <li>Hålla dig inloggad</li>
              <li>Spara dina preferenser</li>
              <li>Förbättra appens prestanda</li>
              <li>Analysera användning (anonymiserat)</li>
            </ul>
            <p className="mt-3">
              Du kan blockera cookies i din webbläsare, men vissa funktioner kan då sluta fungera.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Barns integritet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vår tjänst är inte avsedd för barn under 13 år. Om du är förälder och upptäcker att ditt barn har delat personuppgifter med oss, kontakta oss omedelbart så raderar vi informationen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Ändringar i integritetspolicyn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Vi kan uppdatera denna policy när som helst. Väsentliga ändringar meddelas via e-post eller genom ett meddelande i appen. Fortsatt användning efter ändringar innebär godkännande av den nya policyn.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Klagomål</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Om du är missnöjd med hur vi hanterar dina personuppgifter har du rätt att lämna in ett klagomål till Integritetsskyddsmyndigheten (IMY):
            </p>
            <p className="text-sm">
              Integritetsskyddsmyndigheten<br />
              Box 8114<br />
              104 20 Stockholm<br />
              Telefon: 08-657 61 00<br />
              E-post: imy@imy.se
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Om du har frågor om denna integritetspolicy eller hur vi behandlar dina personuppgifter, kontakta oss:
            </p>
            <p className="text-sm">
              E-post: info@svampjakten.se<br />
              Eller via profilen i appen
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Denna integritetspolicy gäller från {new Date().toLocaleDateString('sv-SE')}</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
