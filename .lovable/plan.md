

## Kodoptimering — Runda 30

Kodbasen ar nu i utmarkt skick. Endast tva minimala fynd kvar:

---

### 1. `species.ts` — `console.warn` ej dev-gatad (rad 183)

`console.warn` for okanda kategorier kors i production. Denna information ar bara relevant vid debugging.

**Atgard:** Wrappa i `if (import.meta.env.DEV)`.

---

### 2. `signedUrl.ts` — `console.error` ej dev-gatad (rad 24)

`console.error('Error creating signed URL:', error)` kors i production for ett icke-kritiskt fel (funktionen faller tillbaka till original-URL). Anvandaren paverkas inte.

**Atgard:** Wrappa i `if (import.meta.env.DEV)`.

---

### Sammanfattning

| Andring | Effekt |
|---------|--------|
| Dev-gata `console.warn` i species.ts | Renare production-logg |
| Dev-gata `console.error` i signedUrl.ts | Renare production-logg |

Tva filer, tva rader. Efter detta ar alla icke-kritiska loggar dev-gatade i hela klient-kodbasen. Kritiska `console.error` i catch-block dar felet kastas vidare (ErrorBoundary, Logbook CRUD-operationer etc.) behalles medvetet — de ar vardefulla for production-debugging av faktiska fel.

