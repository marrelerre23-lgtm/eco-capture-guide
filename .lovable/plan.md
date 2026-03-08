

## Kodoptimering - Runda 2

### Identifierade problem

---

### 1. Oanvända npm-paket att ta bort

| Paket | Anledning |
|-------|-----------|
| `@radix-ui/react-progress` | `progress.tsx` importeras aldrig i appen (custom progress-bar används istället) |
| `@capacitor/ios` | Aldrig importerad i koden (appen är Android-only) |
| `workbox-window` | Aldrig importerad (vite-plugin-pwa hanterar workbox internt) |

**Aktion:** Ta bort dessa 3 paket och ta bort `src/components/ui/progress.tsx`.

---

### 2. Oanvänd devDependency

| Paket | Anledning |
|-------|-----------|
| `@tailwindcss/typography` | Aldrig refererad i `tailwind.config.ts` plugins |

**Aktion:** Ta bort från devDependencies.

---

### 3. `serviceWorkerManager.ts` - bara dev-verktyg

Filen används *enbart* i dev-mode via dynamic import i `main.tsx`. Den exporterar bara diagnostikfunktioner. Kan behållas men bör noteras som dev-only utility. Ingen ändring behövs -- redan korrekt villkorad.

---

### 4. Sidebar-färger i tailwind.config.ts

Tailwind-config definierar `sidebar`-färger (rad 61-70) men appen har ingen sidebar-komponent. Ingen komponent refererar `sidebar-*` klasser.

**Aktion:** Ta bort sidebar-färgblocket från `tailwind.config.ts` (rad 61-70).

---

### 5. `@capacitor/android` och `@capacitor/cli` i dependencies

Dessa paket importeras aldrig i koden -- de är CLI-verktyg. De borde vara i `devDependencies` istället för `dependencies` för att minska produktions-footprint.

**Aktion:** Flytta `@capacitor/android` och `@capacitor/cli` till devDependencies.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort 3 oanvända runtime-paket | Mindre bundle/install |
| Ta bort 1 oanvänd devDependency | Renare dev-setup |
| Ta bort `progress.tsx` | Eliminera död UI-komponent |
| Ta bort sidebar-färger från tailwind | Renare config |
| Flytta 2 Capacitor-paket till devDeps | Korrekt kategorisering |

