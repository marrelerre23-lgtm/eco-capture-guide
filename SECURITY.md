# Säkerhetsguide - Naturens Skatter

Denna fil dokumenterar säkerhetsåtgärderna i applikationen.

## ✅ Implementerade Säkerhetsåtgärder

### 🔐 Autentisering & Auktorisering
- **JWT-baserad autentisering** via Supabase Auth
- **Email-verifiering** med påminnelsebanner för overifierade användare
- **Row Level Security (RLS)** på alla databastabeller
- **Service Role Key** används endast i backend edge functions

### 🛡️ Input Validation
- **Zod schema validation** i alla edge functions
- **URL whitelist** för bilduppladdningar (endast tillåtna domäner)
- **Request body validation** med tydliga felmeddelanden
- **Client-side validation** på alla formulär

### 🚦 Rate Limiting
- **Analysis rate limiting**: 2 sekunders minimum mellan AI-analyser
- **Frontend rate limiting** via `useRateLimit` hook
- **Subscription-based limits**: 
  - Free: 5 analyser/dag, 50 captures totalt
  - Premium: Obegränsade analyser & captures

### 🍪 GDPR & Privacy
- **Cookie Consent Banner** med accept/decline options
- **Privacy Policy** tillgänglig på /privacy
- **Terms of Service** tillgänglig på /terms
- **No tracking** förrän användaren accepterat cookies

### 🔒 API-säkerhet
- **CORS-headers** korrekt konfigurerade
- **Authorization headers** valideras i alla edge functions
- **Error messages** exponerar inte känslig information
- **SQL injection skydd** via Supabase client (inga raw queries)

### 🛑 Error Handling
- **RouteErrorBoundary** på kritiska routes (Camera, Logbook, Map, Analysis)
- **Fallback UI** för alla fel
- **Error logging** till console för debugging
- **User-friendly error messages** på svenska

### 🔄 Daily Reset
- **Cron job** körs klockan 00:00 UTC varje dag
- **Automatic reset** av `analyses_today` för alla användare
- **Edge function** `daily-reset` hanterar logiken

## 📋 Säkerhetschecklista (Före Lansering)

### Kritiskt ⚠️
- [ ] Aktivera "Leaked Password Protection" i Supabase Dashboard
  - Gå till: Authentication → Providers → Email → Password Protection
  - Aktivera: "Check for leaked passwords"
- [ ] Verifiera Site URL och Redirect URLs i Supabase
  - Gå till: Authentication → URL Configuration
  - Lägg till produktion-URL som Site URL
  - Lägg till alla tillåtna redirect URLs
- [ ] Konfigurera Stripe Customer Portal
  - Gå till: https://dashboard.stripe.com/settings/billing/portal
  - Aktivera portalfunktioner som behövs

### Rekommenderat ✅
- [ ] Aktivera Supabase Email Templates
  - Anpassa verifieringsmail och återställningsmail
- [ ] Sätt upp error monitoring (t.ex. Sentry)
- [ ] Konfigurera backup-strategi för databasen
- [ ] Granska alla RLS policies manuellt
- [ ] Testa subscription flow end-to-end
- [ ] Verifiera att alla secrets är säkra i Supabase

## 🔍 RLS Policies

Alla tabeller har Row Level Security aktiverad:

### `profiles`
- Users kan läsa, uppdatera och skapa sin egen profil
- Ingen kan ta bort profiler

### `species_captures`
- Users kan läsa, skapa, uppdatera och ta bort sina egna captures
- Ingen kan se andras captures

### `achievements` & `user_achievements`
- Alla kan se achievements
- Users kan se och skapa sina egna unlocked achievements

### `species_info`
- Alla kan läsa species information
- Ingen kan modifiera (hanteras av admin)

## 🚨 Säkerhetsincidenter

Om du upptäcker en säkerhetsbrist:
1. Dokumentera problemet detaljerat
2. Kontakta utvecklingsteamet omedelbart
3. Implementera en tillfällig fix om möjligt
4. Granska relaterad kod för liknande problem
5. Uppdatera denna dokumentation efter fix

## 🔐 Secrets Management

Secrets hanteras via Supabase Edge Functions:
- `STRIPE_SECRET_KEY` - För Stripe-integrationen
- `GEMINI_API_KEY` - För AI-analyser
- `SUPABASE_SERVICE_ROLE_KEY` - För backend-operationer

**OBS:** Secrets ska ALDRIG committas till git eller exponeras i frontend-kod.

## 📊 Säkerhetsloggning

Följande loggas för säkerhetsändamål:
- Authentication försök (success/fail)
- API rate limit violations
- Subscription limit överträdelser
- Error boundary catches
- Edge function errors

Alla loggar finns i Supabase Dashboard → Functions → Logs.

## 🔄 Uppdateringsrutiner

- **Veckovis**: Kolla Supabase Security Linter för nya varningar
- **Månadsvis**: Granska och uppdatera dependencies
- **Kvartalsvis**: Full säkerhetsaudit av RLS policies
- **Vid incident**: Omedelbar granskning och patch

---

**Senast uppdaterad**: 2025-01-21
**Version**: Fas 2 - Säkerhet & Compliance
