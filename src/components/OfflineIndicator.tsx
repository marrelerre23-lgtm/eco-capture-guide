import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-warning bg-warning/10 p-4 text-warning-foreground shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <p className="text-sm">
        Du är offline. Bilder sparas lokalt och synkas när du är online igen.
      </p>
    </div>
  );
};
