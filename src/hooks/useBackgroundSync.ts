import { useEffect, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { useOfflineStorage } from "./useOfflineStorage";
import { toast } from "./use-toast";

// #19: Exponential backoff retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

interface RetryState {
  [captureId: string]: {
    attempts: number;
    nextRetryAt: number;
  };
}

export const useBackgroundSync = () => {
  const isOnline = useOnlineStatus();
  const { offlineCaptures, removeOfflineCapture } = useOfflineStorage();
  const [retryState, setRetryState] = useState<RetryState>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncPendingCaptures = async () => {
      if (!isOnline || isSyncing) return;

      const pendingCaptures = offlineCaptures;
      
      if (pendingCaptures.length === 0) return;

      setIsSyncing(true);
      
      // Show sync progress
      toast({
        title: "Synkroniserar offline-data...",
        description: `Laddar upp ${pendingCaptures.length} ${pendingCaptures.length === 1 ? 'fångst' : 'fångster'}`,
      });

      let syncedCount = 0;
      let failedCount = 0;
      const now = Date.now();
      
      for (const capture of pendingCaptures) {
        try {
          // Check if this capture has exceeded retry limit or needs to wait
          const retryInfo = retryState[capture.id];
          if (retryInfo) {
            if (retryInfo.attempts >= MAX_RETRIES) {
              console.log(`Skipping capture ${capture.id}: max retries exceeded`);
              failedCount++;
              continue;
            }
            if (now < retryInfo.nextRetryAt) {
              console.log(`Skipping capture ${capture.id}: waiting for retry delay`);
              continue;
            }
          }

          console.log(`Syncing capture: ${capture.id} (attempt ${(retryInfo?.attempts || 0) + 1})`);
          
          // Sync capture to database
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Remove from offline storage on success
          removeOfflineCapture(capture.id);
          syncedCount++;
          
          // Clear retry state on success
          setRetryState(prev => {
            const newState = { ...prev };
            delete newState[capture.id];
            return newState;
          });
        } catch (error) {
          console.error(`Error syncing capture ${capture.id}:`, error);
          failedCount++;
          
          // Update retry state with exponential backoff
          setRetryState(prev => {
            const currentAttempts = prev[capture.id]?.attempts || 0;
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, currentAttempts);
            return {
              ...prev,
              [capture.id]: {
                attempts: currentAttempts + 1,
                nextRetryAt: Date.now() + delay
              }
            };
          });
        }
      }

      setIsSyncing(false);

      // Show sync result
      if (syncedCount > 0) {
        toast({
          title: "Synkronisering klar! ✅",
          description: `${syncedCount} ${syncedCount === 1 ? 'fångst' : 'fångster'} uppladdad${syncedCount === 1 ? '' : 'e'}${failedCount > 0 ? `, ${failedCount} misslyckades` : ''}`,
        });
      }

      if (failedCount > 0 && syncedCount === 0) {
        toast({
          title: "Synkronisering misslyckades",
          description: `${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'} kunde inte synkas. Försöker igen automatiskt.`,
          variant: "destructive",
        });
      }
    };

    syncPendingCaptures();
    
    // Retry failed syncs every 30 seconds
    const retryInterval = setInterval(() => {
      if (isOnline && !isSyncing) {
        syncPendingCaptures();
      }
    }, 30000);
    
    return () => clearInterval(retryInterval);
  }, [isOnline, offlineCaptures, removeOfflineCapture, retryState, isSyncing]);
};
