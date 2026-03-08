import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface OfflineCapture {
  id: string;
  imageUrl: string;
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

const STORAGE_KEY = 'ecocapture_offline_captures';

const readFromStorage = (): OfflineCapture[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useOfflineStorage = () => {
  const [offlineCaptures, setOfflineCaptures] = useState<OfflineCapture[]>(readFromStorage);

  // Listen for storage changes from other hook instances (same tab via custom event)
  useEffect(() => {
    const handleStorageSync = () => {
      setOfflineCaptures(readFromStorage());
    };

    // Cross-tab sync
    window.addEventListener('storage', handleStorageSync);
    // Same-tab sync via custom event
    window.addEventListener('offline-storage-updated', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('offline-storage-updated', handleStorageSync);
    };
  }, []);

  const saveOfflineCapture = useCallback((capture: Omit<OfflineCapture, 'id' | 'timestamp'>) => {
    const newCapture: OfflineCapture = {
      ...capture,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const updated = [...readFromStorage(), newCapture];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setOfflineCaptures(updated);
    window.dispatchEvent(new Event('offline-storage-updated'));

    toast('Sparat offline', {
      description: 'Bilden sparas lokalt och synkas när du är online igen.',
    });

    return newCapture.id;
  }, []);

  const removeOfflineCapture = useCallback((id: string) => {
    const updated = readFromStorage().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setOfflineCaptures(updated);
    window.dispatchEvent(new Event('offline-storage-updated'));
  }, []);

  return {
    offlineCaptures,
    saveOfflineCapture,
    removeOfflineCapture,
  };
};
