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
    const updateBounds = () => {
      const mapBounds = map.getBounds();
      setBounds({
        north: mapBounds.getNorth(),
        south: mapBounds.getSouth(),
        east: mapBounds.getEast(),
        west: mapBounds.getWest(),
      });
    };

    // Initial bounds
    updateBounds();

    // Update on move/zoom with debouncing
    let timeout: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateBounds, 200);
    };

    map.on('moveend', debouncedUpdate);
    map.on('zoomend', debouncedUpdate);

    return () => {
      map.off('moveend', debouncedUpdate);
      map.off('zoomend', debouncedUpdate);
      clearTimeout(timeout);
    };
  }, [map]);

  const isInViewport = (lat: number, lng: number): boolean => {
    if (!bounds) return true; // Render all if bounds not set
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  };

  return { bounds, isInViewport };
};
