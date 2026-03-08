

## Kodoptimering - Runda 8: Bundle-analys och tunga beroenden

---

### 1. `manualChunks` tvingar eager-laddning av lazy-beroenden

Nuvarande `manualChunks` i `vite.config.ts` skapar namngivna chunks för `recharts`, `leaflet` och radix-ui. Problemet: dessa chunks laddas **oberoende av lazy routes** — Vite kan inte koppla dem till rätt lazy-chunk. `recharts` (~200kB minified) och `leaflet` + `leaflet.markercluster` (~180kB) hamnar i separata filer men preloadas ändå.

**Åtgärd:** Ta bort `charts` och `maps` från `manualChunks`. Eftersom `Map.tsx` och `ProfileEnhanced.tsx` (som använder `StatsChart`/recharts) redan lazy-loadas via `React.lazy`, kommer Vite automatiskt att inkludera recharts och leaflet i respektive lazy-chunk. Behåll `vendor` och `supabase` som delade chunks.

Uppdaterad config:
```js
manualChunks: {
  vendor: ["react", "react-dom", "react-router-dom"],
  supabase: ["@supabase/supabase-js"],
}
```

`ui`-chunken kan också tas bort — radix-komponenterna tree-shakes bättre om de följer med respektive lazy-route.

---

### 2. `@capacitor/camera` och `@capacitor/core` i production bundle

Dessa paket (~30kB) importeras bara i `Camera.tsx` och används enbart på native plattformar (`Capacitor.isNativePlatform()`). De ingår i production-bundlen trots att web-appen aldrig kör native-koden.

**Åtgärd:** Dynamisk import i `Camera.tsx` — flytta Capacitor-importen till inuti `uploadFromDevice()`:
```ts
if (typeof window !== 'undefined') {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Camera: CapacitorCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    // ... native camera logic
  }
}
```

---

### 3. `embla-carousel-react` bara på Overview

`embla-carousel-react` (~15kB) importeras via `carousel.tsx` UI-komponent, som enbart används av `Overview.tsx`. Eftersom Overview redan lazy-loadas behövs ingen ytterligare åtgärd — men det förutsätter att `ui`-chunken i `manualChunks` tas bort (punkt 1), så att embla följer med Overview-chunken automatiskt.

**Ingen separat åtgärd** — löses av punkt 1.

---

### 4. `vite-plugin-pwa` i dependencies istället för devDependencies

`vite-plugin-pwa` är ett build-verktyg som bara körs under `vite build`. Det ska vara en devDependency.

**Åtgärd:** Flytta till devDependencies.

---

### 5. `@capacitor/camera` och `@capacitor/core` till devDependencies

Om vi dynamiskt importerar dem (punkt 2) behöver de fortfarande finnas i dependencies för native builds. Men för web-only: de bör vara i devDependencies. Dock — om Capacitor native build fortfarande ska stödjas, behåll i dependencies men lita på dynamic import för web-bundle.

**Åtgärd:** Behåll i dependencies men dynamisk import eliminerar dem från web-bundlen.

---

### Sammanfattning

| Ändring | Uppskattad besparing |
|---------|---------------------|
| Ta bort `charts`, `maps`, `ui` från manualChunks | ~400kB bort från initial load (laddas on-demand) |
| Dynamisk import av Capacitor i Camera.tsx | ~30kB bort från Camera-chunk |
| Flytta `vite-plugin-pwa` till devDependencies | Korrekt kategorisering |

Total effekt: Initial JS-bundle minskas markant — recharts, leaflet och radix-ui-dialog laddas bara när respektive sida besöks.

