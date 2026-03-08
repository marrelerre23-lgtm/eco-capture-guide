

## Kodoptimering — Runda 31

Kodbasen är nu i mycket gott skick. Efter 30 rundor av optimering har jag gjort en grundlig genomgång och hittar ett strukturellt fynd samt en mindre konsistensåtgärd.

---

### 1. `PhotoPreview.tsx` — Duplicerad species-mappningslogik (rad 163–213)

Samma facts-array-konstruktion upprepas nästan identiskt i två grenar: "alternatives"-formatet (rad 163–183) och "legacy"-formatet (rad 195–212). Båda skapar ett species-objekt med samma fält och samma filter-logik.

**Åtgärd:** Extrahera en `mapSpeciesFromAnalysis(speciesData, imageUrl, reasoning?)` helper-funktion som returnerar ett `Species`-objekt. Använd den i båda grenarna. Detta eliminerar ~30 rader duplicerad kod och gör framtida ändringar i mappningen enklare att underhålla.

---

### 2. `useSignedUrl.ts` — `console.error` fortfarande aktiv i hook (rad 46)

Rad 46 har `console.error('Error getting signed URL:', err)` som inte är dev-gatad. Detta är i hooken (inte utils), och felet hanteras med fallback — det är alltså icke-kritiskt, precis som utils-versionen som redan dev-gatades i runda 30.

**Åtgärd:** Wrappa i `if (import.meta.env.DEV)`.

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Extrahera species-mappning i PhotoPreview.tsx | Eliminerar ~30 rader duplicerad kod, enklare underhåll |
| Dev-gata `console.error` i useSignedUrl.ts hook | Konsekvent med utils-versionen, renare production-logg |

