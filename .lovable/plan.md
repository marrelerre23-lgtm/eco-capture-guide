

## Kodoptimering — Runda 20: Oanvända imports, redundanta anrop, död kod

---

### 1. `PhotoPreview.tsx` — oanvända imports och state

- `useEffect` importeras (rad 1) men används **aldrig** i komponenten. Kan tas bort.
- `CheckCircle` och `HelpCircle` importeras (rad 4) men används aldrig. Kan tas bort.
- `refetch` destruktureras från `useSubscription()` (rad 91) men används aldrig. Kan tas bort.
- `tipsDialogOpen` state + `PhotoTipsDialog` renderas (rad 87, 271-275) men det finns **ingen knapp eller trigger** i hela komponenten som sätter `tipsDialogOpen` till `true`. `PhotoTipsDialog` kan aldrig öppnas — det är död kod. Ta bort state, import och rendering.
- Dubbelt `setIsAnalyzing(true)` — anropas på rad 102 OCH rad 124. Det andra anropet är redundant.

**Effekt:** ~15 rader död kod bort, renare imports.

---

### 2. `AnalysisResult.tsx` — `getUser()` kan bytas mot `getSession()`

`handleSave` (rad 101) gör `supabase.auth.getUser()` som triggar ett nätverksanrop. Eftersom användaren redan är autentiserad (Layout redirect-guard), kan detta bytas mot `supabase.auth.getSession()` som är lokalt cachat.

**Effekt:** 1 färre nätverksanrop per sparning.

---

### 3. `useBackgroundSync` — placeholder sync-logik

`useBackgroundSync.ts` rad 52-54 innehåller en `TODO`-kommentar och en `setTimeout(resolve, 1000)` placeholder som simulerar uppladdning men aldrig faktiskt laddar upp till Supabase. Den tar bort offline-captures utan att synka dem. Detta är potentiellt destruktivt — data förloras tyst.

**Åtgärd:** Lägg till en tydlig `import.meta.env.DEV`-logg som varnar att synken är en placeholder, och skippa borttagningen av offline-captures tills riktig upload-logik finns. Alternativt — markera hela funktionen som no-op med en comment block.

---

### 4. `AnalyzingScreen.tsx` — `category` som `MainCategoryKey` lookup med `"fångst"` fallback

`AnalyzingScreen` tar emot `category` som string (rad 16) och gör lookup med `MAIN_CATEGORY_DISPLAY[category as MainCategoryKey]` (rad 138, 141). Men PhotoPreview skickar `MAIN_CATEGORY_DISPLAY[selectedCategory].name` (t.ex. "Svampar") som category — inte nyckeln (t.ex. "svampar"). Lookup mot MAIN_CATEGORY_DISPLAY med display-namnet returnerar `undefined`, och fallbacken `'🔍'` / `category` används. Dessutom skickas strängen `"fångst"` som default — som inte finns i MAIN_CATEGORY_DISPLAY.

**Åtgärd:** Skicka `selectedCategory` (nyckeln) direkt istället för display-namnet, och uppdatera AnalyzingScreen att hantera `null` för auto-detect.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Ta bort oanvända imports/state i PhotoPreview | Renare kod, ~15 rader bort |
| Ta bort dubblerad `setIsAnalyzing(true)` | Logisk korrekthet |
| Byt `getUser()` mot `getSession()` i AnalysisResult | 1 färre nätverksanrop |
| Fixa category-prop till AnalyzingScreen | Korrekt ikon/text-visning |
| Markera useBackgroundSync som placeholder | Förhindra tyst dataförlust |

