

## Kodoptimering — Runda 17: Redundanta auth-anrop och döda kodvägar

---

### 1. `AnalyzingScreen` och `PhotoPreview` — redundanta `supabase.auth.getUser()` + `handleLogout`

Både `AnalyzingScreen.tsx` (rad 49-53) och `PhotoPreview.tsx` (rad 103-107) gör egna `supabase.auth.getUser()` anrop i `useEffect` enbart för att skicka `user` till `<TopNavigation>`. Men dessa komponenter renderas på sidor där `Layout.tsx` redan har `hideNavigation = true` (pathname `/camera` och `/analysis-result`), vilket innebär att Layout:s TopNavigation INTE renderas.

Problemet: Både AnalyzingScreen och PhotoPreview renderar sin egen `<TopNavigation>` — men de gör ett onödigt API-anrop för att hämta user-data som Layout redan har. Dessutom duplicerar de `handleLogout`-logik.

**Åtgärd:** Ta bort de lokala `supabase.auth.getUser()`-anropen och `handleLogout`-funktionerna i AnalyzingScreen och PhotoPreview. Istället: skicka `user` och `onLogout` som props från Camera-sidan (som kan ta emot dem via Layout context eller genom att lyfta ut auth-state). Alternativt — och enklare — ta bort TopNavigation helt från dessa komponenter, eftersom de redan har egna back-knappar och inte behöver full navigation i kamera/analys-läge.

---

### 2. `App.tsx` — redundant `supabase.auth.getUser()` i analytics useEffect (rad 96-103)

`App.tsx` gör ett eget `supabase.auth.getUser()`-anrop vid mount för att sätta analytics userId. Men `Layout.tsx` redan har user-state via `onAuthStateChange`. Detta är ett extra API-anrop vid varje app-start.

**Åtgärd:** Flytta analytics userId-sättning till `Layout.tsx` i `onAuthStateChange`-callbacken, där user-data redan finns. Ta bort `getUser()`-anropet i App.tsx.

---

### 3. `Species.edibility` — kvar i `types/species.ts` men ej i databasen

I runda 16 togs `edibility` bort från `useSpeciesCaptures`, men fältet finns fortfarande kvar i `Species`-interfacet (`types/species.ts` rad 19). Det används i `PhotoPreview.tsx` (rad 205-206, 212, 238, 244) vid parsing av AI-resultat — men det sparas aldrig till databasen. Fältet hämtas från AI-analysen och stoppas in i `facts`-arrayen som strängar.

**Åtgärd:** Ta bort `edibility` från `Species`-interfacet. Behåll parsingen i PhotoPreview som skapar facts-strängar från AI-data — den läser från `analysisResult.species.edibility` (edge function response), inte från Species-typen.

---

### 4. `AnalyzingScreen` — renderar `TopNavigation` bakom en fullscreen overlay

`AnalyzingScreen` renderar `<TopNavigation>` (rad 104) men hela komponenten är en `fixed inset-0 z-50` overlay. TopNavigation hamnar bakom overlayen och är aldrig synlig eller klickbar. Det är död kod som dessutom triggar ett onödigt API-anrop.

**Åtgärd:** Ta bort `<TopNavigation>` från AnalyzingScreen helt, samt tillhörande user-state och handleLogout.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort TopNavigation + auth från AnalyzingScreen | Eliminera 1 redundant API-anrop + död rendering |
| Ta bort auth-anrop från PhotoPreview | Eliminera 1 redundant API-anrop |
| Flytta analytics userId till Layout.tsx | Eliminera 1 redundant API-anrop vid app-start |
| Ta bort `edibility` från Species-interface | Korrekt typning, ingen påverkan på funktionalitet |

Totalt elimineras 3 onödiga `supabase.auth.getUser()`-anrop per session.

