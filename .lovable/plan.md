

## Kodoptimering - Runda 7

---

### 1. Ta bort helt oanvänd fil: `src/utils/serviceWorkerManager.ts`

Filen exporterar `logAppDiagnostics` men den importeras **ingenstans** i projektet. Helt död kod.

**Åtgärd:** Ta bort filen.

---

### 2. Ta bort oanvänd import + helt oanvänt cache-system: `imageCache.ts`

`PhotoPreview.tsx` importerar `getCachedResult` och `setCachedResult` från `imageCache.ts`, men **anropar dem aldrig** — inga `getCachedResult(` eller `setCachedResult(` förekommer i koden. Appen använder enbart `analysisCache.ts` för cachning.

**Åtgärd:** Ta bort importen i `PhotoPreview.tsx`. Ta bort `src/utils/imageCache.ts`.

---

### 3. `useRateLimit` har `toast` i dependency array

`useRateLimit.ts` rad 51: `[key, config, toast]` — `toast` är en importerad funktion från sonner, inte ett state/prop. Det är konstant och behöver inte vara i dependency-arrayen.

**Åtgärd:** Ändra till `[key, config]`.

---

### 4. Dubbla cache-system: `imageCache.ts` vs `analysisCache.ts`

Som noterat ovan är `imageCache.ts` helt oanvänt. `analysisCache.ts` är det enda aktiva cache-systemet (5 min TTL). Ingen åtgärd utöver borttagning av `imageCache.ts` (punkt 2).

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort `serviceWorkerManager.ts` | Död kod borta |
| Ta bort `imageCache.ts` + oanvänd import | Eliminerar helt oanvänt cache-system (~130 rader) |
| Fixa `useRateLimit` dependency array | Korrekt memoization |

