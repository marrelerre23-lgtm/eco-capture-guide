

## Kodoptimering — Runda 23

---

### 1. `useOfflineStorage.ts` — `removeOfflineCaptureById` är död kod

Funktionen exporteras (rad 23-27) med kommentaren "Used by useBackgroundSync", men `useBackgroundSync` importerar den inte längre (togs bort i runda 22). Ingen annan fil använder den. Helt död kod.

**Åtgärd:** Ta bort `removeOfflineCaptureById` och dess kommentar (rad 22-27).

---

### 2. `analytics.ts` — `analytics.setUserId()` anropas i Layout men `analytics.init()` anropas aldrig

I `Layout.tsx` rad 45 anropas `analytics.setUserId()` vid SIGNED_IN. Men `analytics.init()` anropas aldrig — inte i Layout, inte i App.tsx, inte någonstans. Det betyder att `isInitialized` alltid är `false`, och alla `track()`-anrop hamnar i kön (`queue`) utan att skickas förrän `init()` anropas. I App.tsx anropas `analytics.track()` för onboarding, men dessa events hamnar i kön permanent.

**Åtgärd:** Anropa `analytics.init()` i Layout vid SIGNED_IN (efter `setUserId`), eller i App.tsx vid mount. Alternativt, ta bort `isInitialized`-gaten helt — analytics är redan en localStorage-placeholder utan extern provider.

Enklaste fix: Ta bort `isInitialized`-gaten och kölogiken. `sendEvent` skriver bara till localStorage, det finns ingen anledning att buffra.

---

### 3. `Logbook.tsx` — Redundant verbose console.error med emoji-prefix

Rad 432-437 loggar samma error två gånger med `❌`-prefix och en detaljerad breakdown (message, stack, full). Dessutom rad 419 loggar error en tredje gång. I production tas `console.log` bort via terser, men `console.error` behålls. Tre error-loggar för samma fel är onödigt verbose.

**Åtgärd:** Behåll en enda `console.error` per catch-block. Ta bort den redundanta detaljerade loggen (rad 433-437).

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort `removeOfflineCaptureById` från useOfflineStorage | Död kod bort |
| Fixa analytics init-gating (ta bort onödig buffring) | Events skickas korrekt till localStorage |
| Reducera redundanta console.error i Logbook reanalyze | Renare error-loggning i production |

