import { useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { readFromStorage } from "./useOfflineStorage";

/**
 * Background sync hook — placeholder until real upload logic is implemented.
 * Currently a silent no-op that logs pending captures in dev mode.
 */
export const useBackgroundSync = () => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;

    const pendingCaptures = readFromStorage();
    if (pendingCaptures.length > 0 && import.meta.env.DEV) {
      console.log(`[BackgroundSync] ${pendingCaptures.length} pending capture(s) — sync not implemented yet`);
    }
  }, [isOnline]);
};
