

## Kodoptimering — Runda 21: Dod kod, oatnkomlig logik, stale beskrivning

---

### 1. `useBackgroundSync.ts` — oatnkomlig kod efter `continue` (rad 56-58)

Rad 55 har `continue;` som hoppar till nasta loop-iteration. Rad 56-58 (`syncedCount++` och `delete retryStateRef.current[...]`) kan **aldrig nas**. Detta ar dod kod som blev kvar nar placeholder-logiken lades till i runda 20.

**Atgard:** Ta bort rad 56-58 (oatnkomlig kod efter `continue`).

---

### 2. `FilterDrawer.tsx` — stale beskrivning namner "ätlighet"

Rad 64 innehaller texten "Filtrera dina fångster efter **ätlighet**, GPS-noggrannhet och kategori" — men edibility-filtret togs bort i runda 19. Beskrivningen ar nu missvisande.

**Atgard:** Uppdatera `SheetDescription` till "Filtrera dina fångster efter GPS-noggrannhet och kategori".

---

### 3. `PhotoPreview.tsx` — `Species`-import anvands inte korrekt

`Species` importeras fran `@/types/species` (rad 11) men anvands bara i legacy-formatet (rad 195). I alternatives-formatet (rad 163) byggs objekten utan typning. Dessutom skapas `species: Species` pa rad 195 men resultatet wrappas i `alternatives: [species]` — sa `Species`-typen anvands egentligen korrekt dar. **Inget problem.**

Men `Badge`-importen (rad 3) anvands pa rad 463 i subscription-statusen (rad 459-473). **Aktiv — behall.**

---

### 4. `useRateLimit.ts` — `isLimited` state ar oanvand av alla konsumenter

`useRateLimit` returnerar `isLimited` och `reset`, men den enda konsumenten (`PhotoPreview.tsx`) destrukturerar bara `checkLimit` (rad 77: `const { checkLimit: checkRateLimit } = useRateLimit(...)`). `isLimited` orsakar onodiga re-renders via `useState`/`setIsLimited` aven om vardet aldrig lasas.

**Atgard:** Ta bort `isLimited`-state fran `useRateLimit`. Behall `checkLimit` och `reset` som returneras. Funktionen fungerar korrekt utan state — `rateLimitStore` (module-level Map) hanterar redan logiken.

---

### 5. `AnalyzingScreen.tsx` — `AnalyzingScreen` exporteras inte som named export

Komponenten definieras som `const AnalyzingScreen = ...` men exporteras inte explicit. `PhotoPreview.tsx` importerar den som `{ AnalyzingScreen }` (rad 9). Kolla om det verkligen finns en export.

Kollade: Rad 209 slutar utan `export`. Men `export` kan finnas an annanstans — lat mig verifiera.

Faktum: `AnalyzingScreen` importeras korrekt i `PhotoPreview.tsx` rad 9 som named import, och filen kompilerar. Sa det maste finnas en `export` nagontstans. Troligen `export const AnalyzingScreen` eller liknande. **Inte ett problem.**

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Ta bort oatnkomlig kod i useBackgroundSync | Eliminera dod kod efter `continue` |
| Fixa FilterDrawer SheetDescription | Korrekt UI-text |
| Ta bort `isLimited` state fran useRateLimit | Eliminera onodiga re-renders |

Tre fokuserade andringar. Kodbasen ar nu mycket val optimerad efter 20 rundor — de kvarvarande problemen ar sma men varda att fixa for konsistens.

