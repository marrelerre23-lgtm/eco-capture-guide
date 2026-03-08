

## Kodoptimering — Runda 19: Dod edibility-filter, redundanta getUser-anrop, oanvanda imports

---

### 1. Edibility-filter — helt dod kodvag i FilterDrawer + Logbook

`FilterDrawer.tsx` har ett komplett edibility-filter (rad 35-37, 59, 63, 83-91) med props `edibilityFilter`, `onEdibilityChange`, `showEdibilityFilter`. Men i `Logbook.tsx` skickas alltid `showEdibilityFilter={false}`, `edibilityFilter=""`, `onEdibilityChange={() => {}}`. Filtret renderas **aldrig** och koden ar dod.

I `PhotoPreview.tsx` (rad 191, 198, 228) lasas `edibility` fran AI-responsen och stoppas in i facts-arrayen som en strang (`Atlighet: ...`). Detta ar korrekt — det ar transient data fran edge function, inte fran Species-typen. Men rad 191 satter `edibility: alt.species.edibility || null` direkt pa objektet, vilket inte matchar Species-interfacet (edibility togs bort i runda 17).

**Atgard:**
- Ta bort `edibilityFilter`, `onEdibilityChange`, `showEdibilityFilter` props och all relaterad logik fran `FilterDrawer.tsx`
- Ta bort de doda props fran Logbook.tsx anropet
- Ta bort `edibility: alt.species.edibility || null` (rad 191) fran PhotoPreview.tsx — datan fångas redan i facts-arrayen

---

### 2. `useSpeciesCaptures` — redundant `getUser()` anrop

`useSpeciesCaptures.ts` rad 40 gor `supabase.auth.getUser()` for att kontrollera om anvandaren ar inloggad. Men RLS-policies pa `species_captures` gar redan pa `auth.uid()`, sa fragan returnerar tom data om anvandaren inte ar inloggad. `getUser()`-anropet ar onodigt — det gor ett extra API-anrop for varje query.

**Atgard:** Ta bort `getUser()`-anropet. Lat queryn kora direkt — RLS hanterar access. Om det inte finns nagon session returnerar Supabase tom data.

---

### 3. `useAchievements` — tva redundanta `getUser()` anrop

`useAchievements.ts` gor `supabase.auth.getUser()` i bade `queryFn` for user-achievements (rad 46) och i `unlockMutation` (rad 66). RLS-policyn pa `user_achievements` kräver `auth.uid() = user_id`, sa `getUser()` ar onodigt for queryn. For mutation behövs user.id for INSERT — men det kan hämtas fran `supabase.auth.getSession()` (synkront cached) istallet for `getUser()` (nätverksanrop).

**Atgard:** Byt `getUser()` mot `getSession()` i bada fallen. Session ar lokalt cachad och gor inget nätverksanrop.

---

### 4. `useSubscription` — `getUser()` kan bytas mot `getSession()`

`useSubscription.ts` rad 46 anvander `getUser()` for att hamta user.id. Samma optimering som ovan — byt till `getSession()`.

**Atgard:** Byt `getUser()` mot `getSession()` i `fetchSubscriptionInfo`.

---

### 5. Oanvand `Badge`-import i `Overview.tsx`

`Overview.tsx` rad 2 importerar `Badge` fran `@/components/ui/badge` men den anvands aldrig i komponenten.

**Atgard:** Ta bort den oanvanda importen.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Ta bort edibility-filter fran FilterDrawer + Logbook | ~60 rader dod kod bort |
| Ta bort `edibility`-falt fran PhotoPreview objektbygge | Korrekt typning |
| Byt `getUser()` mot `getSession()` i 4 stallen | 4 farre nätverksanrop per session |
| Ta bort oanvand Badge-import i Overview | Renare kod |

