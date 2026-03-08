

## Kodoptimering — Runda 12: Stabilitet och sista rensningen

Kodbasen är nu mycket ren. Denna runda fokuserar på en kritisk bugg och mindre rensningar.

---

### 1. Kritisk bugg: `useBackgroundSync` infinite loop-risk

`useBackgroundSync` har `offlineCaptures` i sin `useEffect`-dependency array (rad 98). När den anropar `removeOfflineCapture`, dispatchar den ett `offline-storage-updated`-event som triggar `setOfflineCaptures` i **samma** hook-instans — vilket skapar en ny array-referens → effekten körs igen → nästa capture tas bort → loop.

**Åtgärd:** Refaktorera `useBackgroundSync` till att använda en ref för captures istället för att ha `offlineCaptures` som dependency. Läs captures direkt från localStorage vid sync-tillfället istället för att reagera på state-ändringar.

---

### 2. `NotFound` importeras statiskt i `App.tsx`

Alla andra sidor lazy-loadas, men `NotFound` (rad 6) importeras statiskt och hamnar i initial bundle. Den behövs sällan.

**Åtgärd:** Lazy-loada `NotFound` precis som övriga sidor.

---

### 3. `sonner.tsx` exporterar `toast` men ingen importerar den

`src/components/ui/sonner.tsx` (rad 28) exporterar `{ Toaster, toast }`, men alla filer som använder toast importerar direkt från `"sonner"`, inte från UI-wrappern. `toast`-exporten är onödig.

**Åtgärd:** Ta bort `toast`-exporten från `sonner.tsx`.

---

### 4. `NotFound` använder `console.error` för 404 — bör vara `console.warn`

En 404 är inte ett applikationsfel — det är en användarnavigering till en ogiltig URL. `console.error` är missvisande.

**Åtgärd:** Byt till `console.warn` i `NotFound.tsx`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Fixa infinite loop i useBackgroundSync | Förhindra potentiell krasch |
| Lazy-loada NotFound | Mindre initial bundle (~1kB) |
| Rensa onödig toast-export | Renare API |
| console.warn istället för console.error i 404 | Korrekt log-nivå |

