

## Kodoptimering — Runda 22

---

### 1. `useBackgroundSync.ts` — oanvand import + no-op logik som visar missvisande toast

`removeOfflineCaptureById` importeras (rad 3) men anropas aldrig — borttagningen togs bort i runda 20. Dessutom ar hela hook:en nu en no-op: den visar "Synkroniserar offline-data..." toast och kör ett 30-sekunders intervall, men synkar aldrig nagot och `syncedCount` kan aldrig ökas. Toasten ar missvisande for användaren.

**Atgard:**
- Ta bort `removeOfflineCaptureById` fran importen
- Skippa toast-visningen och intervallet nar ingen riktig sync-logik finns. Gör hela funktionen till en riktig no-op som bara loggar i dev-mode att sync inte ar implementerat, utan att störa användaren med falska toasts.

---

### 2. `Overview.tsx` — oanvand `Loader2` import

`Loader2` importeras (rad 3) men anvands aldrig i komponenten. Skelettet (`OverviewSkeleton`) har ersatt den.

**Atgard:** Ta bort `Loader2` fran lucide-react importen.

---

### 3. `PhotoPreview.tsx` — onödig `React` default import

Rad 1: `import React, { useState } from "react"`. Med Vites JSX-transform behövs inte `React` i scope. Bara `useState` anvands.

**Atgard:** Andra till `import { useState } from "react"`.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Göra useBackgroundSync till riktig no-op (ta bort falsk toast + intervall) | Inga missvisande meddelanden till anvandaren |
| Ta bort oanvand `removeOfflineCaptureById` import | Renare kod |
| Ta bort `Loader2` fran Overview.tsx | Renare import |
| Ta bort `React` default import fran PhotoPreview | Renare import |

Fyra sma men meningsfulla andringar. Kodbasen ar nu nastan helt optimerad.

