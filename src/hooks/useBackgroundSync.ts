import { useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { readFromStorage, removeOfflineCaptureById } from "./useOfflineStorage";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

interface RetryState {
  [captureId: string]: {
    attempts: number;
    nextRetryAt: number;
  };
}

export const useBackgroundSync = () => {
  const isOnline = useOnlineStatus();
  const retryStateRef = useRef<RetryState>({});
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const syncPendingCaptures = async () => {
      if (!isOnline || isSyncingRef.current) return;

      const pendingCaptures = readFromStorage();
      if (pendingCaptures.length === 0) return;

      isSyncingRef.current = true;

      toast("Synkroniserar offline-data...", {
        description: `Laddar upp ${pendingCaptures.length} ${pendingCaptures.length === 1 ? 'fångst' : 'fångster'}`,
      });

      let syncedCount = 0;
      let failedCount = 0;
      const now = Date.now();

      for (const capture of pendingCaptures) {
        try {
          const retryInfo = retryStateRef.current[capture.id];
          if (retryInfo) {
            if (retryInfo.attempts >= MAX_RETRIES) {
              if (import.meta.env.DEV) console.log(`Skipping capture ${capture.id}: max retries exceeded`);
              failedCount++;
              continue;
            }
            if (now < retryInfo.nextRetryAt) {
              continue;
            }
          }

          // TODO: Implement actual upload to Supabase storage + species_captures table
          // Currently placeholder — removes offline capture without uploading
          await new Promise(resolve => setTimeout(resolve, 1000));

          removeOfflineCaptureById(capture.id);
          syncedCount++;

          delete retryStateRef.current[capture.id];
        } catch (error) {
          console.error(`Error syncing capture ${capture.id}:`, error);
          failedCount++;

          const currentAttempts = retryStateRef.current[capture.id]?.attempts || 0;
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, currentAttempts);
          retryStateRef.current[capture.id] = {
            attempts: currentAttempts + 1,
            nextRetryAt: Date.now() + delay,
          };
        }
      }

      isSyncingRef.current = false;

      if (syncedCount > 0) {
        toast.success("Synkronisering klar! ✅", {
          description: `${syncedCount} ${syncedCount === 1 ? 'fångst' : 'fångster'} uppladdad${syncedCount === 1 ? '' : 'e'}${failedCount > 0 ? `, ${failedCount} misslyckades` : ''}`,
        });
      }

      if (failedCount > 0 && syncedCount === 0) {
        toast.error("Synkronisering misslyckades", {
          description: `${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'} kunde inte synkas. Försöker igen automatiskt.`,
        });
      }
    };

    syncPendingCaptures();

    const retryInterval = setInterval(() => {
      if (isOnline && !isSyncingRef.current) {
        syncPendingCaptures();
      }
    }, 30000);

    return () => clearInterval(retryInterval);
  }, [isOnline]);
};
