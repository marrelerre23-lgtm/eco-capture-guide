

## Kodoptimering — Runda 13: Duplicering, beroendehantering och caching-konflikt

Kodbasen är i mycket gott skick efter 12 rundor. Denna runda adresserar de sista kvarvarande problemen.

---

### 1. Duplicerad `OfflineCapture`-interface

`OfflineCapture` definieras identiskt i **två filer**: `useOfflineStorage.ts` (rad 4-9) och `useBackgroundSync.ts` (rad 25-30). Detta bryter DRY-principen och riskerar drift om en ändras utan den andra.

**Atgard:** Exportera `OfflineCapture` från `useOfflineStorage.ts` och importera den i `useBackgroundSync.ts`. Ta bort den duplicerade `readCapturesFromStorage`-funktionen i `useBackgroundSync.ts` och importera `readFromStorage` från `useOfflineStorage.ts` (som redan gör exakt samma sak).

---

### 2. Redundant SW-caching-regel i `vite.config.ts`

Rad 64-75 har en `StaleWhileRevalidate`-regel för `*.js|*.css` — men rad 36-50 har redan en `CacheFirst`-regel för `/assets/*.js|*.css`. Vites build-output hamnar alltid i `/assets/` med content hashes. Den generella regeln matchar inga filer som inte redan fångas av den specifika regeln, och om den gör det skapar den en konflikterande caching-strategi.

**Atgard:** Ta bort den redundanta `StaleWhileRevalidate`-regeln (rad 64-75).

---

### 3. `@capacitor/camera` och `@capacitor/core` — bör vara devDependencies

Dessa paket importeras **enbart dynamiskt** i `Camera.tsx` (rad 254-256) via `await import(...)` och bara på native-plattformar. I web-builds inkluderas de inte i bundlen. De behövs bara för Capacitor-byggen (Android/iOS) och bör kategoriseras som `devDependencies` precis som `@capacitor/android` och `@capacitor/cli` redan är.

**Atgard:** Flytta `@capacitor/camera` och `@capacitor/core` till `devDependencies`.

---

### 4. `gpsGuidance.ts` duplicerar logik med `formatGpsAccuracy.ts`

`getGpsAccuracyIcon` i `formatGpsAccuracy.ts` och `icon`-fältet i `getGpsGuidanceMessage` i `gpsGuidance.ts` returnerar samma emoji-ikoner baserat på accuracy-nivåer, men med **inkonsistenta tröskelvärden** (50 vs 10/50/200/1000). Båda importeras i `AnalysisResult.tsx`.

**Atgard:** Ta bort `icon`-fältet från `getGpsGuidanceMessage` (det används bara i `AnalysisResult.tsx` som redan kan använda `getGpsAccuracyIcon`). Uppdatera `AnalysisResult.tsx` att använda `getGpsAccuracyIcon` konsekvent.

---

### 5. `analytics.ts` — `getCategoryFromEvent` är för enkel

`getCategoryFromEvent` (rad 70-73) returnerar `'user_journey'` för `onboarding_`-events och `'general'` för allt annat. Det finns bara 2 events definierade (`ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`). Hela analytics-systemet lagrar bara i localStorage utan att skicka data någonstans. Det är i praktiken en no-op utöver lokal lagring.

**Atgard:** Ingen kodändring — detta är en medveten placeholder. Men lägga till en kommentar som tydliggör att detta är en placeholder för framtida analytics-integration.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Konsolidera OfflineCapture-interface | Eliminera duplicering, minska driftrisker |
| Ta bort redundant SW-caching-regel | Renare config, inga caching-konflikter |
| Flytta Capacitor-paket till devDependencies | Korrekt dependency-kategorisering |
| Konsolidera GPS-ikonlogik | Konsistenta tröskelvärden, renare API |
| Kommentera analytics som placeholder | Tydlighet för framtida utvecklare |

