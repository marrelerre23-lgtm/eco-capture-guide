

## Kodoptimering — Runda 18: Oanvand import, dod subscription-logik, redundant auth

---

### 1. `App.tsx` — oanvand `supabase`-import

`supabase` importeras pa rad 11 men anvands **ingenstans** i filen. Analytics userId-logiken flyttades till Layout.tsx i runda 17, men importen lamnades kvar.

**Atgard:** Ta bort `import { supabase } from "./integrations/supabase/client"` fran App.tsx.

---

### 2. `useSubscription` — `isAnalysisLimitReached` ar alltid `false`

`isAnalysisLimitReached` satts till `false` hardkodat pa rad 97 i useSubscription.ts — bade i DEFAULT_SUBSCRIPTION och i fetchSubscriptionInfo. Det beraknas aldrig. Anda anvands det i PhotoPreview.tsx (rad 492, 497) for att visa "grans nadd"-meddelande, som alltsa **aldrig triggas**.

**Atgard:** Berakna `isAnalysisLimitReached` korrekt: `analysesRemaining === 0` (nar maxAnalysesPerDay inte ar null). Om analys-granser verkligen ar borttagna (check_user_limits returnerar alltid true for analysis), ta bort feltet helt fran interfacet och ta bort den doda UI-koden i PhotoPreview.

Baserat pa `check_user_limits` (som alltid returnerar `TRUE` for analysis) och att det inte finns nagra analys-granser — ta bort `isAnalysisLimitReached` helt, samt den relaterade UI-koden i PhotoPreview.

---

### 3. `useSubscription` — redundant `supabase.auth.getUser()` i setupRealtimeListener

`setupRealtimeListener` (rad 121-122) gor ett separat `getUser()`-anrop for att fa user.id till realtime-filtret. Men `fetchSubscriptionInfo` som anropas pa rad 117 gor redan samma anrop. Resultatet anvands inte vidare.

**Atgard:** Refaktorera sa att setupRealtimeListener tar userId som parameter fran fetchSubscriptionInfo:s resultat, eller cacha userId i en ref.

---

### 4. `AnalysisResult.tsx` — onodigt 300ms setTimeout for initialisering (rad 50-58)

`setIsInitializing(false)` wrapas i en 300ms timeout for att "visa skeleton". Men alternativdata kommer fran `location.state` som ar synkront tillgangligt — det finns inget att vanta pa. Det ger 300ms fordrojning utan nagon nytta.

**Atgard:** Ta bort setTimeout och satt `isInitializing = false` direkt. Behold redirect-logiken om alternatives ar tomma.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Ta bort oanvand supabase-import i App.tsx | Renare kod |
| Ta bort `isAnalysisLimitReached` + dod UI | Eliminera vilseledande dod kod |
| Eliminera redundant getUser i useSubscription | 1 farre API-anrop |
| Ta bort 300ms setTimeout i AnalysisResult | Snabbare navigation |

