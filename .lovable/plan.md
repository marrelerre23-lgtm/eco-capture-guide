

## Kodoptimering - Runda 10: Slutstädning och synkronisering

---

### 1. `vite.config.ts` — stale config-rester

- **`optimizeDeps.exclude: ["react-leaflet"]`** — `react-leaflet` är avinstallerat och inte importerat någonstans. Denna rad är en kvarleva.
- **`optimizeDeps.include: ["leaflet"]`** — Leaflet importeras nu dynamiskt i `SpeciesModal` och `Map`. `optimizeDeps.include` pre-bundlar för dev-servern men är irrelevant för produktion. Med dynamisk import behövs inte heller pre-bundling i dev.
- **`resolve.dedupe: ["react", "react-dom"]`** och extra `resolve.alias` för react/react-dom — dessa löstes ett `react-leaflet` problem som inte längre existerar.

**Åtgärd:** Ta bort `optimizeDeps`-blocket helt. Ta bort de extra react/react-dom alias och `dedupe` — behåll bara `@`-aliaset.

---

### 2. `analytics.ts` — `process.env.NODE_ENV` istället för `import.meta.env.DEV`

Rad 48 använder `process.env.NODE_ENV === 'development'` — detta fungerar i Vite men är inkonsekvent med resten av kodbasen som använder `import.meta.env.DEV`. Dessutom — `drop_console: true` i terser tar bort `console.log` i produktion, men `process.env.NODE_ENV`-checken är ändå onödig overhead.

**Åtgärd:** Byt till `import.meta.env.DEV` för konsistens.

---

### 3. Dubbla auth-lyssnare — `App.tsx` + `Layout.tsx`

Båda `App.tsx` (rad 105-113) och `Layout.tsx` (rad 31-42) sätter upp `onAuthStateChange`-lyssnare. `App.tsx` invaliderar queries, `Layout.tsx` sätter user-state och redirectar. Dessa kan konsolideras till en enda lyssnare i `Layout.tsx` som också invaliderar queries — eliminerar en onödig Supabase-prenumeration.

**Åtgärd:** Flytta `queryClient.invalidateQueries()` / `queryClient.clear()` logiken till `Layout.tsx`-lyssnaren. Ta bort den separata `useEffect` i `App.tsx`. Importera `useQueryClient` i `Layout.tsx`.

---

### 4. `useBackgroundSync` — synkar egentligen inget

`useBackgroundSync` loopar igenom offline-captures men **gör inget faktiskt upload** — rad 53 är bara `await new Promise(resolve => setTimeout(resolve, 1000))` (en 1-sekunds delay), sedan `removeOfflineCapture`. Captures "synkas" genom att bara raderas utan att skickas till servern.

**Åtgärd:** Antingen implementera faktisk upload-logik (anropa `uploadCaptureFromDataUrl` + spara till `species_captures`), eller — om offline-sync inte är en aktiv feature — ta bort `useBackgroundSync` helt och rensa `useOfflineStorage`-användningen i `Camera.tsx` om den inte behövs.

Rekommendation: Markera som "placeholder" med en TODO-kommentar, eftersom en fullständig implementation kräver att offline-captures sparar tillräckligt med data (bild + analysresultat) för att kunna synkas.

---

### 5. `Onboarding.tsx` — `markOnboardingComplete` exporteras men används bara internt

`markOnboardingComplete` (rad 16-18) exporteras men anropas bara inuti `Onboarding`-komponenten. Den kan göras privat (inte exporteras).

**Åtgärd:** Ta bort `export` från `markOnboardingComplete`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Rensa stale vite.config (optimizeDeps, dedupe, alias) | Renare config, snabbare dev-start |
| Fixa `process.env.NODE_ENV` → `import.meta.env.DEV` | Konsistens |
| Konsolidera auth-lyssnare till en plats | En färre Supabase-prenumeration, enklare flöde |
| Markera useBackgroundSync som placeholder | Tydlighet — synkar inte faktiskt |
| Ta bort onödig export i Onboarding | Renare API-yta |

