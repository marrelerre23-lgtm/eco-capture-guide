

## Kodoptimering - Runda 9

---

### 1. Oanvänd `session`-state i `Layout.tsx` orsakar onödiga re-renders

`Layout.tsx` rad 19: `const [session, setSession] = useState<Session | null>(null)` — `session` sätts på rad 36 och 50 men **läses aldrig**. Bara `user` används. Varje auth-state-ändring triggar en extra `setSession`-anrop som orsakar en onödig re-render av hela Layout-trädet.

**Åtgärd:** Ta bort `session`-state, ta bort `Session`-importen, ta bort båda `setSession()`-anropen.

---

### 2. `useBackgroundSync` har instabil dependency array → re-render-loop

`useBackgroundSync.ts` rad 115: useEffect beror på `[isOnline, offlineCaptures, removeOfflineCapture, retryState, isSyncing]`. Problemet:
- `removeOfflineCapture` är en **ny funktion varje render** (inte memoizerad i `useOfflineStorage`)
- `offlineCaptures` ändras varje gång `removeOfflineCapture` anropas → useEffect körs om → anropar `removeOfflineCapture` igen

**Åtgärd i `useOfflineStorage.ts`:** Wrappa `removeOfflineCapture` i `useCallback`.

**Åtgärd i `useBackgroundSync.ts`:** Ta bort `retryState` och `isSyncing` från dependency array — använd refs istället för att undvika re-render-loopar. Behåll bara `[isOnline, offlineCaptures, removeOfflineCapture]`.

---

### 3. `SpeciesModal.tsx` importerar Leaflet statiskt (~180kB)

`SpeciesModal` importerar `L from "leaflet"` direkt. Denna komponent används av `Logbook.tsx` (lazy-loaded), vilket innebär att **Logbook-chunken inkluderar hela Leaflet-biblioteket** — trots att kartan i modalen bara visas ibland.

**Åtgärd:** Dynamisk import av Leaflet inuti `SpeciesModal` — ladda `L` och CSS enbart när kartfliken öppnas.

---

### 4. `PWAInstallPrompt` har `console.log` i produktion

Rad 41: `console.log("PWA installed")` körs i alla miljöer.

**Åtgärd:** Wrappa i `import.meta.env.DEV`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort oanvänd `session`-state i Layout | Färre re-renders av hela app-trädet |
| Stabilisera `useBackgroundSync` dependencies | Eliminerar potentiell re-render-loop |
| Dynamisk import av Leaflet i SpeciesModal | ~180kB mindre i Logbook-chunken |
| Ta bort produktions-`console.log` i PWAInstallPrompt | Renare produktion |

