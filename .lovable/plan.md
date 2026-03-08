

## Kodoptimering - Runda 11: Finslipning

Efter grundlig genomgång av alla filer, hooks, utils, och komponenter finns det få kvarvarande problem. Kodbasen är i mycket gott skick. Här är de sista fynden:

---

### 1. Död route-referens i `Layout.tsx`

Rad 27 kollar `location.pathname === "/photo-preview"` men denna route existerar inte i `App.tsx`. Det finns ingen `/photo-preview`-route — `PhotoPreview` är en komponent som renderas inuti Camera-sidan, inte en separat route.

**Åtgärd:** Ta bort `"/photo-preview"` från `hideNavigation`-checken.

---

### 2. `vite-plugin-pwa` är production dependency — bör vara devDependency

`vite-plugin-pwa` används bara i `vite.config.ts` vid build-tid. Den ska vara i `devDependencies`, precis som `rollup-plugin-visualizer` redan är.

**Åtgärd:** Flytta `vite-plugin-pwa` till `devDependencies`.

---

### 3. `useBackgroundSync` + `useOfflineStorage` — delat state-problem

`useBackgroundSync` (i Layout) anropar `useOfflineStorage` och skapar sin egen React state-instans. `Camera.tsx` anropar också `useOfflineStorage` och skapar en separat instans. Dessa delar **inte** state — de synkar bara via `localStorage` vid mount. Det innebär att om Camera sparar en offline-capture, ser inte `useBackgroundSync` den förrän nästa re-mount av Layout (dvs aldrig under samma session).

**Åtgärd:** Refaktorera `useOfflineStorage` till att använda ett `storage`-event-lyssnare så att alla instanser reagerar på localStorage-ändringar gjorda av andra hook-instanser.

---

### 4. `drop_console: true` i terser tar bort **alla** console-metoder

`drop_console: true` tar bort `console.log`, `console.error`, `console.warn` — allt. Detta är problematiskt eftersom `console.error` i catch-block är viktiga för felsökning i produktion.

**Åtgärd:** Byt till `pure_funcs: ['console.log']` så att bara `console.log` tas bort, medan `console.error` och `console.warn` behålls.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort `/photo-preview` från hideNavigation | Rensa död referens |
| Flytta `vite-plugin-pwa` till devDependencies | Korrekt dependency-kategorisering |
| Synka `useOfflineStorage` mellan instanser | Offline-sync fungerar korrekt |
| Behåll `console.error` i produktion | Bättre felsökning |

