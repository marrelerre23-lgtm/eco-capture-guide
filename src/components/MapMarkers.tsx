import { Marker, Popup } from 'react-leaflet';
import { useMapViewport } from '@/hooks/useMapViewport';
import { useMemo } from 'react';

interface Capture {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url: string;
  location_name?: string | null;
  captured_at: string;
  ai_analysis?: {
    species?: {
      commonName?: string;
      scientificName?: string;
    };
  } | null;
}

interface MapMarkersProps {
  captures: Capture[];
}

/**
 * Optimized markers component that only renders markers in viewport
 * Improves performance for large datasets
 */
export const MapMarkers = ({ captures }: MapMarkersProps) => {
  const { bounds } = useMapViewport();

  // Only render markers that are in viewport
  const visibleCaptures = useMemo(() => {
    if (!bounds) return captures; // Show all if bounds not yet available
    
    return captures.filter(capture => {
      if (!capture.latitude || !capture.longitude) return false;
      
      const lat = Number(capture.latitude);
      const lng = Number(capture.longitude);
      
      // Check latitude
      const latInRange = lat >= bounds.south && lat <= bounds.north;
      
      // Check longitude (handle antimeridian crossing)
      let lngInRange: boolean;
      if (bounds.west <= bounds.east) {
        // Normal case: bounds don't cross antimeridian
        lngInRange = lng >= bounds.west && lng <= bounds.east;
      } else {
        // Special case: bounds cross antimeridian (e.g., west=170, east=-170)
        lngInRange = lng >= bounds.west || lng <= bounds.east;
      }
      
      return latInRange && lngInRange;
    });
  }, [captures, bounds]);

  console.log(`[MapMarkers] Rendering ${visibleCaptures.length} of ${captures.length} markers`);

  return (
    <>
      {visibleCaptures.map(capture => {
        const lat = Number(capture.latitude);
        const lng = Number(capture.longitude);
        const species = capture.ai_analysis?.species;

        return (
          <Marker key={capture.id} position={[lat, lng]}>
            <Popup maxWidth={200} minWidth={150}>
              <div className="p-1">
                <div className="aspect-square relative mb-1 rounded overflow-hidden bg-muted">
                  <img
                    src={capture.image_url}
                    alt={species?.commonName || 'Capture'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h4 className="font-semibold text-xs leading-tight">{species?.commonName || 'Okänd art'}</h4>
                <p className="text-xs text-muted-foreground italic truncate">{species?.scientificName}</p>
                {capture.location_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{capture.location_name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(capture.captured_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
