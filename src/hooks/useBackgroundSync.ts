import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOnlineStatus } from "./useOnlineStatus";
import { useOfflineStorage } from "./useOfflineStorage";

export const useBackgroundSync = () => {
  const isOnline = useOnlineStatus();
  const { offlineCaptures, removeOfflineCapture } = useOfflineStorage();

  useEffect(() => {
    const syncPendingCaptures = async () => {
      if (!isOnline) return;

      const pendingCaptures = offlineCaptures;
      
      for (const capture of pendingCaptures) {
        try {
          // For now, just log - full sync will be implemented later
          console.log("Syncing capture:", capture.id);
          
          // Remove from offline storage
          removeOfflineCapture(capture.id);
        } catch (error) {
          console.error("Error syncing capture:", error);
        }
      }
    };

    syncPendingCaptures();
  }, [isOnline, offlineCaptures, removeOfflineCapture]);
};
