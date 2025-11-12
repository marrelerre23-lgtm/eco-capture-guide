import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Hook to track map viewport and only render markers in view
 * Improves performance for large datasets
 */
export const useMapViewport = () => {
  const map = useMap();
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    if (!map) {
      console.error('[useMapViewport] Map instance not available');
      return;
    }

    const updateBounds = () => {
      try {
        if (!map || !map.getBounds) {
          console.warn('[useMapViewport] Map or getBounds not available');
          return;
        }
        
        const mapBounds = map.getBounds();
        setBounds({
          north: mapBounds.getNorth(),
          south: mapBounds.getSouth(),
          east: mapBounds.getEast(),
          west: mapBounds.getWest(),
        });
      } catch (error) {
        console.error('[useMapViewport] Error updating bounds:', error);
      }
    };

    // Initial bounds with delay to ensure map is ready
    const initTimeout = setTimeout(updateBounds, 100);

    // Update on move/zoom with debouncing
    let timeout: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateBounds, 200);
    };

    map.on('moveend', debouncedUpdate);
    map.on('zoomend', debouncedUpdate);

    return () => {
      clearTimeout(initTimeout);
      clearTimeout(timeout);
      if (map && map.off) {
        map.off('moveend', debouncedUpdate);
        map.off('zoomend', debouncedUpdate);
      }
    };
  }, [map]);

  return { bounds };
};
