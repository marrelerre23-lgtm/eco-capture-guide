

## Kodoptimering - Runda 6

---

### 1. Oanvända npm-paket att ta bort

| Paket | Anledning |
|-------|-----------|
| `@capacitor-community/admob` | Aldrig importerad i koden (bara omnämnd i text) |
| `date-fns` | Noll importer i hela projektet |

**Aktion:** Avinstallera båda.

---

### 2. Paket som ska flyttas till devDependencies

| Paket | Anledning |
|-------|-----------|
| `@types/leaflet` | Type definitions — devDependency |
| `@types/leaflet.markercluster` | Type definitions — devDependency |
| `rollup-plugin-visualizer` | Build-verktyg, inte runtime |

Notering: `@capacitor/android` och `@capacitor/cli` skulle ha flyttats i runda 2 men sitter fortfarande i `dependencies`. Dessa ska också flyttas nu.

---

### 3. Oanvänd util-fil: `src/utils/signedUrl.ts`

`getSignedCaptureUrl` importeras **enbart** av `useSignedUrl.ts` (som i sin tur importeras av `LazyImage.tsx`). Filen i sig har ingen direkt konsument utanför hooken. Det är okej — den används indirekt. **Ingen åtgärd.**

---

### 4. Oanvända exports i `useOfflineStorage`

`clearAllOfflineCaptures` och `hasOfflineCaptures` exporteras men används aldrig utanför hooken. Ingen extern konsument.

**Aktion:** Ta bort dessa två från return-objektet.

---

### 5. `supportsWebP` exporteras i onödan

Funktionen i `imageCompression.ts` exporteras men används bara internt i samma fil.

**Aktion:** Ta bort `export` från `supportsWebP`.

---

### 6. `@capacitor/android` och `@capacitor/cli` fortfarande i dependencies

Dessa skulle ha flyttats i runda 2 men sitter kvar. De är CLI/build-verktyg.

**Aktion:** Flytta till devDependencies (ingår i punkt 2 ovan).

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort 2 oanvända paket (`admob`, `date-fns`) | Mindre install/bundle |
| Flytta 5 paket till devDependencies | Korrekt kategorisering |
| Ta bort oanvända exports i `useOfflineStorage` | Renare API |
| Ta bort onödig export på `supportsWebP` | Renare API |

