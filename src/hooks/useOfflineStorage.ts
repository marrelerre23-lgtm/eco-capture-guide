import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineCapture {
  id: string;
  imageUrl: string;
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

const STORAGE_KEY = 'ecocapture_offline_captures';

export const useOfflineStorage = () => {
  const { toast } = useToast();
  const [offlineCaptures, setOfflineCaptures] = useState<OfflineCapture[]>([]);

  useEffect(() => {
    loadOfflineCaptures();
  }, []);

  const loadOfflineCaptures = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOfflineCaptures(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline captures:', error);
    }
  };

  const saveOfflineCapture = (capture: Omit<OfflineCapture, 'id' | 'timestamp'>) => {
    const newCapture: OfflineCapture = {
      ...capture,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    const updated = [...offlineCaptures, newCapture];
    setOfflineCaptures(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    toast({
      title: 'Sparat offline',
      description: 'Bilden sparas lokalt och synkas när du är online igen.'
    });

    return newCapture.id;
  };

  const removeOfflineCapture = (id: string) => {
    const updated = offlineCaptures.filter(c => c.id !== id);
    setOfflineCaptures(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAllOfflineCaptures = () => {
    setOfflineCaptures([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    offlineCaptures,
    saveOfflineCapture,
    removeOfflineCapture,
    clearAllOfflineCaptures,
    hasOfflineCaptures: offlineCaptures.length > 0
  };
};
