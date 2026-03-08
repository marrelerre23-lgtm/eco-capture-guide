

## Kodoptimering — Runda 24

---

### 1. `AnalyzingScreen.tsx` — onödig `React` default import

Rad 1: `import React, { useState, useEffect } from "react"`. Komponenten använder aldrig `React.` — inga `React.forwardRef`, `React.FC`, eller liknande. Bara `useState` och `useEffect` behövs.

**Åtgärd:** Ändra till `import { useState, useEffect } from "react"`.

---

### 2. `useOfflineStorage.ts` — tomma rader kvar efter borttagen funktion

Rad 22-24 är tre tomma rader som blev kvar efter att `removeOfflineCaptureById` togs bort i runda 23. Onödig whitespace.

**Åtgärd:** Reducera till en tom rad.

---

### 3. `Camera.tsx` — onödig `React` default import

Rad 1: `import React, { useState, useRef } from "react"`. `React` används dock på rad 367 (`React.useEffect`) och rad 312 (`React.ChangeEvent`). Dessa bör skrivas om till direktimport istället.

**Åtgärd:** Ändra till `import { useState, useRef, useEffect, ChangeEvent } from "react"` och uppdatera `React.useEffect` → `useEffect` och `React.ChangeEvent` → `ChangeEvent` i filen.

---

### 4. `Auth.tsx` och `ForgotPassword.tsx` — onödig `React` default import

Båda filerna importerar `React` men använder bara `React.FormEvent`. Kan skrivas om till `import { useState, FormEvent } from "react"`.

**Åtgärd:** Ta bort `React` default import, importera `FormEvent` direkt, och uppdatera typreferenserna.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort `React` default import från AnalyzingScreen | Renare import |
| Fixa tomma rader i useOfflineStorage | Renare kod |
| Refaktorera Camera.tsx att inte använda `React.` prefix | Konsekvent importstil |
| Refaktorera Auth.tsx och ForgotPassword.tsx | Konsekvent importstil |

Fem filer, fokus på att eliminera alla onödiga `React` default imports (utom class components och `React.forwardRef`-filer som faktiskt behöver dem).

