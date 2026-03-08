

## Kodoptimering — Runda 16: Typduplicering, döda fält och redundanta API-anrop

---

### 1. Duplicerat `Species`-interface (3 definitioner)

`Species` definieras i **tre ställen**:
- `src/types/species.ts` (central, enkel — saknar `coordinates`, `location`, `notes`, `isFavorite`, `gpsAccuracy`)
- `src/pages/Logbook.tsx` (rad 56-80, utökad med UI-fält)
- `src/components/SpeciesModal.tsx` (rad 10-32, liknande utökning)

Logbook och SpeciesModal har nästan identiska lokala `Species`-interfaces med fält som `coordinates`, `location`, `notes`, `isFavorite`, `gpsAccuracy`, och `facts` som objekt-array. Den centrala typen i `types/species.ts` saknar dessa.

**Atgard:** Utöka det centrala `Species`-interfacet i `types/species.ts` med de saknade fälten (alla optionella). Ta bort de lokala `interface Species`-definitionerna i Logbook.tsx och SpeciesModal.tsx och importera från `types/species.ts`.

---

### 2. `edibility` på `SpeciesCapture` — dött fält

`useSpeciesCaptures.ts` rad 16 definierar `edibility?: string` på `SpeciesCapture`-interfacet, men det finns **ingen `edibility`-kolumn** i databasen (species_captures-tabellen). `select("*")` returnerar aldrig detta fält — det blir alltid `undefined`. Edibility-data finns i `ai_analysis` JSON, inte som en egen kolumn.

**Atgard:** Ta bort `edibility` från `SpeciesCapture`-interfacet.

---

### 3. Redundant `supabase.auth.getUser()` i `AppRoutes`

`App.tsx` rad 53-61 gör ett eget `getUser()`-anrop för att kontrollera email-verifiering. Men `Layout.tsx` har redan `user`-state som sätts via `onAuthStateChange` + `getSession`. Det innebär ett extra API-anrop vid varje mount.

**Atgard:** Flytta email-verifieringskontrollen till `Layout.tsx` där `user` redan finns. Skicka `unverifiedEmail` som prop genom `AppRoutes` eller via React Context.

---

### 4. Oanvänd `setShowCookieConsent` i `AppRoutes`

`App.tsx` rad 50: `setShowCookieConsent` skapas men anropas aldrig. `CookieConsent`-komponenten hanterar sin egen synlighet internt.

**Atgard:** Byt till en enkel `const`-variabel: `const showCookieConsent = !hasCookieConsent()`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Konsolidera Species-interface till en central typ | Eliminera 3-vägs duplicering, enklare underhåll |
| Ta bort `edibility` från SpeciesCapture | Korrekt typning mot DB-schema |
| Flytta email-verifiering till Layout | Eliminera redundant API-anrop |
| Förenkla cookie-consent-state | Ta bort oanvänd setter |

