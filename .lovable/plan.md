

## Kodoptimering och borttagning av död kod

### Analys sammanfattning

Jag har identifierat flera kategorier av problem: oanvända UI-komponenter, oanvända npm-paket, duplicerad logik, och oanvända filer.

---

### 1. Oanvända UI-komponenter (kan tas bort)

Dessa filer i `src/components/ui/` importeras **aldrig** i appen:

| Fil | Radix-paket |
|-----|-------------|
| `collapsible.tsx` | `@radix-ui/react-collapsible` |
| `alert.tsx` | - |

Dessa UI-komponenter har motsvarande Radix-paket installerade men **varken komponenten eller paketet** används:

- `@radix-ui/react-hover-card` - ingen komponent, ingen import
- `@radix-ui/react-context-menu` - ingen import
- `@radix-ui/react-menubar` - ingen import
- `@radix-ui/react-navigation-menu` - ingen import
- `@radix-ui/react-popover` - ingen import
- `@radix-ui/react-radio-group` - ingen import
- `@radix-ui/react-scroll-area` - ingen import
- `@radix-ui/react-separator` - ingen import
- `@radix-ui/react-switch` - ingen import
- `@radix-ui/react-toggle` - ingen import
- `@radix-ui/react-toggle-group` - ingen import
- `@radix-ui/react-aspect-ratio` - ingen import

**Aktion:** Ta bort `collapsible.tsx` och `alert.tsx`. Avinstallera 12 oanvända Radix-paket.

---

### 2. Oanvända npm-paket (kan avinstalleras)

Dessa paket importeras **aldrig** i koden:

| Paket | Anledning |
|-------|-----------|
| `@hookform/resolvers` | Ingen import |
| `react-hook-form` | Ingen import |
| `vaul` | Ingen import (drawer-komponent) |
| `react-day-picker` | Ingen import (kalender) |
| `input-otp` | Ingen import |
| `cmdk` | Ingen import (command palette) |
| `react-resizable-panels` | Ingen import |
| `@radix-ui/react-hover-card` | Ingen import |
| `@radix-ui/react-context-menu` | Ingen import |
| `@radix-ui/react-menubar` | Ingen import |
| `@radix-ui/react-navigation-menu` | Ingen import |
| `@radix-ui/react-popover` | Ingen import |
| `@radix-ui/react-radio-group` | Ingen import |
| `@radix-ui/react-scroll-area` | Ingen import |
| `@radix-ui/react-separator` | Ingen import |
| `@radix-ui/react-switch` | Ingen import |
| `@radix-ui/react-toggle` | Ingen import |
| `@radix-ui/react-toggle-group` | Ingen import |
| `@radix-ui/react-aspect-ratio` | Ingen import |

**Aktion:** Ta bort alla dessa från `package.json`.

---

### 3. Duplicerad offline-synklogik

`App.tsx` (rad 145-190) och `useBackgroundSync.ts` gör **exakt samma sak** -- synkar offline-captures när appen går online. `useBackgroundSync` har dessutom bättre logik (exponential backoff, retry). `Layout.tsx` kör redan `useBackgroundSync()`.

**Aktion:** Ta bort den duplicerade synk-useEffect och `useOfflineStorage`/`useOnlineStatus`-importerna från `App.tsx`.

---

### 4. Duplicerade cache-system

`PhotoPreview.tsx` använder **två** cache-system samtidigt:
- `imageCache.ts` (LRU-cache, 7 dagar TTL)
- `analysisCache.ts` (5 min TTL, duplikatskydd)

Dessa har olika syften: `analysisCache` förhindrar dubbletter inom 5 min, `imageCache` är en långtidscache. Men `imageCache` verkar aldrig faktiskt anropas med rätt hash i `PhotoPreview`. Behöver verifieras men kan potentiellt konsolideras.

**Aktion:** Behåll båda tills vidare -- de fyller olika funktioner (kort- vs långtidscache). Ingen ändring.

---

### 5. Överflödiga debug-loggar

`serviceWorkerManager.ts` loggar diagnostik (React version, Leaflet version etc.) vid varje appstart. `main.tsx` loggar SW-status. Dessa är development-only och bör tas bort eller villkoras bakom `import.meta.env.DEV`.

**Aktion:** Wrappa alla console.log/console.group i `main.tsx` och `serviceWorkerManager.ts` med `if (import.meta.env.DEV)`.

---

### 6. Onödiga markdown-filer i roten

Flera `.md`-filer i projektroten är development docs som inte behövs i produktion:
- `ADMOB_SETUP.md`
- `ANALYTICS_INTEGRATION.md`
- `CAPACITOR_MOBILAPP_GUIDE.md`
- `FORCE_REBUILD.txt`
- `SECURITY.md`
- `SECURITY_CHECKLIST.md`

**Aktion:** Dessa påverkar inte bundle-storlek men kan tas bort för att rensa projektet.

---

### Sammanfattning av ändringar

| Ändring | Filer | Effekt |
|---------|-------|--------|
| Ta bort oanvända UI-komponenter | 2 filer | Renare kodbas |
| Ta bort 19 oanvända npm-paket | `package.json` | Mindre `node_modules`, snabbare install |
| Ta bort duplicerad sync i App.tsx | `App.tsx` | Eliminera dubbla toasts, renare logik |
| Villkora debug-loggar | `main.tsx`, `serviceWorkerManager.ts` | Renare produktion |
| Ta bort dev-docs | 6 filer | Renare repo |

Total uppskattad minskning av installerade paket: ~19 paket.

