

## Kodoptimering — Runda 14: Minnesläckor, duplicering och finputsning

Kodbasen har genomgått 13 optimeringsrundor och är i mycket gott skick. Denna runda identifierar de sista kvarvarande problemen.

---

### 1. Minnesläcka i `exportData.ts` — `URL.revokeObjectURL` saknas

Både `exportToCSV` och `exportToJSON` skapar `URL.createObjectURL(blob)` men anropar aldrig `URL.revokeObjectURL(url)` efterat. Varje export lakar en blob-URL i minnet.

**Atgard:** Laga till `URL.revokeObjectURL(url)` efter `link.click()` i bada funktionerna.

---

### 2. `SecureImage` och `LazyImage` — overlappande ansvar

Bada komponenterna wrapppar `useSignedUrl` for att visa bilder fran Supabase Storage. `SecureImage` anvands i Overview och SpeciesModal. `LazyImage` anvands i Logbook. De gor nestan samma sak men `LazyImage` har lazy loading via `react-intersection-observer`.

Att sla ihop dem ar ett storre refaktoreringsjobb. **Ingen atgard nu** — bada anvands aktivt med olika features (lazy loading vs direkt rendering). Men markera med kommentar att de delar logik.

---

### 3. `useBackgroundSync` importerar `useOfflineStorage` men anvander bara `removeOfflineCapture`

Hooken importerar hela `useOfflineStorage()` (rad 19) men anvander bara `removeOfflineCapture`. Det innebar att `useBackgroundSync` skapar en state-instans (`offlineCaptures`) som aldrig lases. Den lyssnar ocksa pa storage-events och uppdaterar state i onodan.

**Atgard:** Extrahera `removeOfflineCapture` som en fristaaende funktion fran `useOfflineStorage.ts` (den behover inte React state) och importera den direkt i `useBackgroundSync`. Da slipper vi en onoding React state-instans.

---

### 4. `useSubscription` — `fetchSubscriptionInfo` aterskapas varje render

`fetchSubscriptionInfo` ar inte wrapped i `useCallback`, sa den aterskapas vid varje render. Den anvands i `useEffect` och returneras som `refetch`. Den fungerar korrekt tack vare att `useEffect` har `[]` som deps, men det ar inte optimalt.

**Atgard:** Wrappa `fetchSubscriptionInfo` i `useCallback` med tomma deps.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| `URL.revokeObjectURL` i exportData | Fixa minnesla cka |
| Extrahera `removeOfflineCapture` fran React state | Mindre overhead i useBackgroundSync |
| `useCallback` for `fetchSubscriptionInfo` | Stabil funktionsreferens |

