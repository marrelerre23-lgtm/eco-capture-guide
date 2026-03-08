

## Kodoptimering — Runda 25

### 1. `Onboarding.tsx` — onödig `React` default import

Rad 1: `import React, { useState } from 'react'`. `React` används bara på rad 47 som `React.FC<OnboardingProps>`. `React.FC` är avrådd i modern React och kan ersättas med en vanlig funktionssignatur: `({ onComplete }: OnboardingProps)`.

**Åtgärd:** Ta bort `React` default import, ändra `React.FC<OnboardingProps>` till direkt prop-typing.

---

### 2. `NotFound.tsx` — `console.warn` i production

Rad 8: `console.warn("404: ...")` körs alltid, även i production. Till skillnad från `console.log` tas inte `console.warn` bort av terser. Bör dev-gatas.

**Åtgärd:** Wrappa i `if (import.meta.env.DEV)`.

---

### 3. `Map.tsx` — `console.error` vid render

Rad 318: `console.error('[Map] Error state:', error)` körs varje render när `error` finns — inklusive re-renders. Loggar i production. Bör dev-gatas eller tas bort (error visas redan i UI).

**Åtgärd:** Wrappa i `if (import.meta.env.DEV)`.

---

### 4. `Logbook.tsx` — emoji i `console.error`

Rad 419: `console.error('❌ [Reanalyze] Edge function returned error:', error)` — emoji-prefix i production error-logg. Bör rensas till ren text.

**Åtgärd:** Ändra till `console.error('[Reanalyze] Edge function error:', error)`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort `React` default import från Onboarding | Konsekvent importstil, avrådd `React.FC` bort |
| Dev-gata `console.warn` i NotFound | Renare production-logg |
| Dev-gata `console.error` i Map render | Undvik upprepade error-loggar i production |
| Ta bort emoji från Logbook error-logg | Renare production-logg |

