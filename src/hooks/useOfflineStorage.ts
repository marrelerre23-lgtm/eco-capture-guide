import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface OfflineCapture {
  id: string;
  imageUrl: string;
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

const STORAGE_KEY = 'ecocapture_offline_captures';

export const useOfflineStorage = () => {
  const [offlineCaptures, setOfflineCaptures] = useState<OfflineCapture[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfflineCaptures(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline captures:', error);
    }
  }, []);

  const saveOfflineCapture = useCallback((capture: Omit<OfflineCapture, 'id' | 'timestamp'>) => {
    const newCapture: OfflineCapture = {
      ...capture,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    setOfflineCaptures(prev => {
      const updated = [...prev, newCapture];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    toast('Sparat offline', {
      description: 'Bilden sparas lokalt och synkas när du är online igen.',
    });

    return newCapture.id;
  }, []);

  const removeOfflineCapture = useCallback((id: string) => {
    setOfflineCaptures(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    offlineCaptures,
    saveOfflineCapture,
    removeOfflineCapture,
  };
};
