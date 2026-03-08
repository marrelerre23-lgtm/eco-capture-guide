

## Kodoptimering - Runda 5: Re-renders, prestanda och död kod

---

### 1. Duplicerat `useBackgroundSync()`-anrop

`useBackgroundSync()` körs i **två** ställen samtidigt:
- `Layout.tsx` (rad 23) — körs **alltid** för alla sidor
- `Camera.tsx` (rad 39) — körs **också** när kamerasidan visas

Eftersom Layout redan kör hooken globalt, skapas dubbla 30-sekunders intervaller och dubbla synk-toasts på kamerasidan.

**Åtgärd:** Ta bort `useBackgroundSync()` och dess import från `Camera.tsx`.

---

### 2. Duplicerad auth-lyssnare i App.tsx + Layout.tsx

Båda `App.tsx` (rad 106) och `Layout.tsx` (rad 32) sätter upp `supabase.auth.onAuthStateChange` — dubbla lyssnare. `App.tsx` hanterar query-invalidering, `Layout.tsx` hanterar user-state och redirect. Det fungerar men är onödigt.

**Åtgärd:** Behåll båda — de gör olika saker. Dock en minor fix: `Layout.tsx` rad 66 har `[navigate, location.pathname]` som dependency, vilket återskapar auth-lyssnaren vid varje route-byte. Bör ändras till `[]` (lyssnaren behöver inte återskapas).

---

### 3. Oanvänd import `useInfiniteScroll` i Logbook

`useInfiniteScroll` importeras på rad 18 men anropas aldrig — Logbook använder `categoryPages` state istället. Hooken och dess fil (`src/hooks/useInfiniteScroll.ts`) är helt oanvänd.

**Åtgärd:** Ta bort importen från Logbook. Ta bort `src/hooks/useInfiniteScroll.ts`.

---

### 4. Oanvänd `useSubscription` i Logbook

`const { subscription } = useSubscription()` (rad 200) — `subscription` refereras aldrig i Logbook. Hooken skapar en Supabase Realtime-kanal och gör en profil-query i onödan.

**Åtgärd:** Ta bort `useSubscription`-importen och anropet från Logbook.

---

### 5. `categorizedSpecies` useMemo saknar dependencies

`categorizedSpecies` (rad 510-615) använder `categoryPages`, `isMobile`, och `gpsAccuracyFilter` i sin beräkning men inkluderar dem inte i dependency-arrayen. Detta ger stale data vid paginering och filtrering.

**Åtgärd:** Lägg till `categoryPages`, `isMobile`, `gpsAccuracyFilter` i dependency-arrayen.

---

### 6. Produktionsloggar att villkora

Dessa `console.log`-anrop körs i produktion:

| Fil | Beskrivning |
|-----|-------------|
| `Logbook.tsx` rad 438-465 | 6 st reanalyze debug-loggar |
| `PhotoPreview.tsx` rad 131-263 | 7 st analys/upload debug-loggar |
| `Map.tsx` rad 155, 171, 301, 314 | 4 st GPS/loading loggar |
| `CookieConsent.tsx` rad 19, 25 | Cookie-loggar |
| `useSpeciesCaptures.ts` rad 44 | "No user" logg |
| `useBackgroundSync.ts` rad 48, 53, 58 | Sync debug-loggar |

**Åtgärd:** Wrappa alla med `if (import.meta.env.DEV)`.

---

### 7. Layout `useEffect` dependency orsakar onödiga re-subscribes

`Layout.tsx` rad 66: `[navigate, location.pathname]` — auth-lyssnaren återskapas vid varje sidnavigering. `navigate` ändras aldrig men `location.pathname` ändras hela tiden, vilket subscribe/unsubscribe:ar auth-lyssnaren i onödan.

**Åtgärd:** Ändra till `[]` och hantera redirect via refs eller villkorlig logik inuti callbacken.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort duplicerat `useBackgroundSync` i Camera | Inga dubbla synk-intervaller |
| Ta bort oanvänd `useInfiniteScroll` import + fil | Död kod borta |
| Ta bort oanvänd `useSubscription` i Logbook | En mindre Realtime-kanal, snabbare render |
| Fixa `categorizedSpecies` dependencies | Korrekt paginering/filtrering |
| Fixa Layout auth-lyssnare dependency | Inga onödiga re-subscribes vid navigering |
| Villkora ~20 console.log i produktion | Ren produktionskonsol |

