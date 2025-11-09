import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert className="fixed top-4 left-4 right-4 z-50 bg-warning text-warning-foreground border-warning shadow-lg">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Du är offline. Bilder sparas lokalt och synkas när du är online igen.
      </AlertDescription>
    </Alert>
  );
};
