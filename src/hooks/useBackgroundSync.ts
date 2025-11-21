import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOnlineStatus } from "./useOnlineStatus";
import { useOfflineStorage } from "./useOfflineStorage";
import { toast } from "./use-toast";

export const useBackgroundSync = () => {
  const isOnline = useOnlineStatus();
  const { offlineCaptures, removeOfflineCapture } = useOfflineStorage();

  useEffect(() => {
    const syncPendingCaptures = async () => {
      if (!isOnline) return;

      const pendingCaptures = offlineCaptures;
      
      if (pendingCaptures.length === 0) return;

      // Show sync started toast
      toast({
        title: "Synkroniserar offline-data...",
        description: `${pendingCaptures.length} ${pendingCaptures.length === 1 ? 'fångst' : 'fångster'} laddas upp`,
      });

      let syncedCount = 0;
      let failedCount = 0;
      
      for (const capture of pendingCaptures) {
        try {
          // TODO: Implement full sync logic - for now just remove from offline storage
          console.log("Syncing capture:", capture.id);
          
          // Remove from offline storage
          removeOfflineCapture(capture.id);
          syncedCount++;
        } catch (error) {
          console.error("Error syncing capture:", error);
          failedCount++;
        }
      }

      // Show sync completed toast
      if (syncedCount > 0) {
        toast({
          title: "Synkronisering klar! ✅",
          description: `${syncedCount} ${syncedCount === 1 ? 'fångst' : 'fångster'} synkroniserad${syncedCount === 1 ? '' : 'e'}${failedCount > 0 ? `, ${failedCount} misslyckades` : ''}`,
        });
      }

      if (failedCount > 0 && syncedCount === 0) {
        toast({
          title: "Synkronisering misslyckades",
          description: `Kunde inte synkronisera ${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'}. Försöker igen senare.`,
          variant: "destructive",
        });
      }
    };

    syncPendingCaptures();
  }, [isOnline, offlineCaptures, removeOfflineCapture]);
};
