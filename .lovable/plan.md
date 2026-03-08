

## Kodoptimering — Runda 28

Kodbasen är i mycket gott skick. Kvarvarande fynd är tre mindre konsistensåtgärder.

---

### 1. `RouteErrorBoundary.tsx` — `React.ErrorInfo` → namngivd import

Rad 14 och 35 använder `React.ErrorInfo`, men `ErrorInfo` kan importeras direkt från `'react'` — precis som `ErrorBoundary.tsx` redan gör. Detta gör att `React` default import kan tas bort (class components behöver den inte längre med modern JSX transform).

**Åtgärd:** Lägg till `ErrorInfo` i namngivna imports, ta bort `React` default import, ändra `React.ErrorInfo` → `ErrorInfo` på rad 14 och 35.

---

### 2. `analytics.ts` — `console.error` i production + emoji i dev-loggar

- Rad 56: `console.error('Failed to store analytics event:', error)` körs i production för icke-kritiska localStorage-fel. Bör dev-gatas.
- Rad 22 och 39: Emoji `📊` i dev-gated loggar — bör tas bort för konsistens med övriga filer.

**Åtgärd:** Wrappa rad 56 i `if (import.meta.env.DEV)`, ta bort emoji-prefix från rad 22 och 39.

---

### 3. `Logbook.tsx` — emoji i dev-gated loggar

Rad 410 och 423 har emoji (`🔄`, `✅`) i dev-gated `console.log`-anrop. Bör rensas för konsistens.

**Åtgärd:** Ta bort emoji-prefix, behåll `[Reanalyze]`-prefix.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Namngivd `ErrorInfo`-import i RouteErrorBoundary, ta bort `React` default | Konsekvent importstil |
| Dev-gata + rensa emoji i analytics.ts | Renare production-logg, konsekvent stil |
| Rensa emoji i Logbook dev-loggar | Konsekvent loggstil |

