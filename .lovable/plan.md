

## Kodoptimering — Runda 15: Slutgiltig finjustering

Kodbasen är i utmärkt skick. Denna runda adresserar de absolut sista fynden.

---

### 1. `useSubscription` — `fetchSubscriptionInfo` saknas i `useEffect` deps (rad 149)

`fetchSubscriptionInfo` är nu wrapped i `useCallback` (från runda 14), men `useEffect` på rad 116-149 har fortfarande `[]` som dependency array. ESLint-regeln `react-hooks/exhaustive-deps` kräver att `fetchSubscriptionInfo` inkluderas. Eftersom `useCallback` har tomma deps är det säkert att lägga till den — den ändras aldrig, men koden blir korrekt och lint-fri.

**Atgard:** Lagg till `fetchSubscriptionInfo` i dependency array pa rad 149.

---

### 2. `CookieConsent` importerar `Cookie` och `X` men `X` ar onodigt avancerat

Nej — bada anvands. Inga problem har.

Daremot: `CookieConsent` renderas pa VARJE sidladdning i `AppRoutes` (rad 57 i App.tsx), aven nar cookien redan ar accepterad. Komponenten kollar localStorage i `useEffect`, men den mountas och renderas forst — onodigt arbete.

**Atgard:** Flytta localStorage-checken utanfor komponenten sa att den inte mountas alls om consent redan getts. Anvand en utility-funktion `hasCookieConsent()` i `App.tsx` och villkora renderingen dar.

---

### 3. `EmailVerificationBanner` — samma problem

`EmailVerificationBanner` mountas pa varje sidladdning och gor ett `supabase.auth.getUser()` anrop i `useEffect` — aven om anvandaren redan verifierat sin email. Det ger ett onodigt API-anrop pa VARJE navigation.

**Atgard:** Flytta verifieringslogiken till `Layout.tsx` dar `user` redan ar tillganglig. Skicka `emailVerified`-status som prop till `EmailVerificationBanner` istallet for att gora ett nytt API-anrop.

---

### 4. `Layout.tsx` — `setTimeout` 100ms ar ett fragilt hack (rad 61-65)

`setTimeout(() => setLoading(false), 100)` anvands for att "vanta" pa session-initialisering. Detta ar opaalitligt — 100ms ar godtyckligt och kan vara for kort pa langsamma enheter eller for langt pa snabba.

**Atgard:** Ta bort `setTimeout` och satt `setLoading(false)` direkt efter `getSession` resolvar. `onAuthStateChange` ar redan konfigurerat fore `getSession`-anropet, sa det finns inget race condition.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| `fetchSubscriptionInfo` i useEffect deps | Lint-korrekt, inga dolda buggar |
| Villkora CookieConsent-rendering | Undvik onodigt mount/render |
| Optimera EmailVerificationBanner | Eliminera redundant API-anrop |
| Ta bort setTimeout-hack i Layout | Snabbare och mer palitlig laddning |

