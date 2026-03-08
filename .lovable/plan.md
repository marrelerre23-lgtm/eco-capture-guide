

## Kodoptimering - Runda 4

### Kritisk bugg: Toast-systemet är trasigt

Den viktigaste upptäckten: **Alla toast-notifikationer i appen är osynliga.**

Appen har två toast-system:
1. **Sonner** (`sonner.tsx`) — renderas av `<Toaster />` i Layout, visar visuella toasts
2. **Custom shadcn-system** (`use-toast.ts` + `toast.tsx`) — dispatchar till intern minnesstate, men **ingen komponent renderar dessa toasts**

Alla 17 filer som anropar `toast({ title, description })` importerar från `@/hooks/use-toast`, som dispatchar till en intern store. Men det finns ingen `<Toaster>`-komponent som läser `.toasts` och renderar dem. Resultatet: alla toast-anrop (felmeddelanden, bekräftelser, synk-status) går till ett svart hål.

**Åtgärd:** Migrera alla `toast()`-anrop till Sonner's API:
- `toast({ title, description })` → `toast(title, { description })`
- `toast({ variant: "destructive", title, description })` → `toast.error(title, { description })`
- `import { useToast } from "@/hooks/use-toast"` → `import { toast } from "sonner"` (ta bort hook-anropet)
- Ta bort `src/hooks/use-toast.ts` och `src/components/ui/toast.tsx` efteråt

Berörda filer (17 st):
- `src/hooks/useBackgroundSync.ts`
- `src/hooks/useOfflineStorage.ts`
- `src/hooks/useAchievements.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useRateLimit.ts`
- `src/pages/Camera.tsx`
- `src/pages/Auth.tsx`
- `src/pages/AnalysisResult.tsx`
- `src/pages/Install.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/Logbook.tsx`
- `src/pages/ProfileEnhanced.tsx`
- `src/components/PhotoPreview.tsx`
- `src/components/ShareDialog.tsx`
- `src/components/EmailVerificationBanner.tsx`
- `src/components/RecategorizationDialog.tsx`

---

### 2. Produktionsloggar som bör villkoras

Dessa `console.log`-anrop körs i produktion och bör wrappas i `if (import.meta.env.DEV)`:

| Fil | Rad | Logg |
|-----|-----|------|
| `analytics.ts` | 21, 27 | Analytics init/user set |
| `analysisCache.ts` | 38, 59 | Cache hit/set meddelanden |
| `imageCompression.ts` | 59 | Komprimeringsstorlek |
| `imageCache.ts` | 114, 127 | LRU eviction loggar |

(`console.error` behålls -- de indikerar faktiska fel.)

---

### 3. Ta bort döda filer efter migrering

| Fil | Anledning |
|-----|-----------|
| `src/hooks/use-toast.ts` | Helt ersatt av Sonner |
| `src/components/ui/toast.tsx` | Bara type-exports för det döda toast-systemet |

---

### Sammanfattning

| Ändring | Effekt |
|---------|--------|
| Migrera 17 filer till Sonner toast | **Fixar trasiga toast-notifikationer** (kritisk bugg) |
| Ta bort `use-toast.ts` + `toast.tsx` | Eliminera dött toast-system |
| Villkora 6 console.log-anrop | Renare produktion |

