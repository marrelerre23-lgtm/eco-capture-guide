

## Kodoptimering — Runda 26

---

### 1. `RouteErrorBoundary.tsx` — emoji i `console.error`

Rad 36: `console.error(\`❌ [\${...}] Error caught:\`, ...)`. Samma mönster som fixades i Logbook i runda 25.

**Åtgärd:** Ta bort emoji-prefix, ändra till `console.error(\`[\${this.props.routeName || 'Route'}] Error caught:\`, error, errorInfo)`.

---

### 2. `useBackgroundSync.ts` — no-op placeholder skapar onödig overhead

Hooken anropas i Layout på varje render. Den sätter upp en `useOnlineStatus`-lyssnare (som lägger till/tar bort `online`/`offline` event listeners) enbart för att logga ett meddelande i dev-mode. Ingen synk-logik är implementerad. Detta är ren overhead utan funktionalitet.

**Åtgärd:** Ta bort `useBackgroundSync` helt — både hooken (`src/hooks/useBackgroundSync.ts`) och importen/anropet i `Layout.tsx`. Om synk-logik behövs i framtiden kan den återskapas då.

---

### 3. `SecureImage.tsx`, `Logbook.tsx`, `PhotoTipsDialog.tsx` — `React.`-prefix utan explicit import

Dessa filer använder `React.ReactNode` eller `React.MouseEvent` utan att importera `React`. Det fungerar via globala typer (`@types/react`), men bryter mot projektets mönster att använda namngivna imports. Konsistens med övriga filer (runda 24-25).

**Åtgärd:**
- `SecureImage.tsx`: Ändra `React.ReactNode` → `ReactNode`, lägg till `import { ReactNode } from 'react'`
- `Logbook.tsx`: Ändra `React.MouseEvent` → `MouseEvent` på rad 215, lägg till `MouseEvent` i befintlig import
- `PhotoTipsDialog.tsx`: Ändra `React.ReactNode` → `ReactNode`, lägg till `import { ReactNode } from 'react'`

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort emoji från RouteErrorBoundary error-logg | Renare production-logg |
| Ta bort `useBackgroundSync` (no-op) + import i Layout | Eliminerar onödig overhead |
| Namngivna imports i SecureImage, Logbook, PhotoTipsDialog | Konsekvent importstil |

