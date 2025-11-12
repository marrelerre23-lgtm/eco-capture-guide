import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSpeciesCaptures } from '@/hooks/useSpeciesCaptures';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Locate, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getMainCategory, MAIN_CATEGORY_DISPLAY } from '@/types/species';
import { MapSkeleton } from '@/components/LoadingSkeleton';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const Map = () => {
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.3293, 18.0686]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Filter captures with valid coordinates
  const validCaptures = useMemo(() => {
    if (!captures) return [];
    return captures.filter(c => c.latitude && c.longitude);
  }, [captures]);

  // Get unique categories and locations
  const categories = useMemo(() => {
    const cats = new Set(
      validCaptures
        .map(c => {
          const category = c.ai_analysis?.species?.category;
          if (!category) return null;
          return getMainCategory(category);
        })
        .filter(Boolean)
    );
    return Array.from(cats);
  }, [validCaptures]);

  const locations = useMemo(() => {
    const locs = new Set(validCaptures.map(c => c.location_name).filter(Boolean));
    return Array.from(locs);
  }, [validCaptures]);

  // Apply filters
  const filteredCaptures = useMemo(() => {
    let filtered = validCaptures;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => {
        const category = c.ai_analysis?.species?.category;
        if (!category) return false;
        return getMainCategory(category) === selectedCategory;
      });
    }
    
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(c => c.location_name === selectedLocation);
    }
    
    return filtered;
  }, [validCaptures, selectedCategory, selectedLocation]);

  // Calculate hotspots
  const hotspots = useMemo(() => {
    const clusters: { [key: string]: { count: number; lat: number; lng: number; captures: typeof validCaptures } } = {};
    const gridSize = 0.01;

    validCaptures.forEach(capture => {
      if (!capture.latitude || !capture.longitude) return;
      
      const lat = Number(capture.latitude);
      const lng = Number(capture.longitude);
      const gridKey = `${Math.floor(lat / gridSize)},${Math.floor(lng / gridSize)}`;
      
      if (!clusters[gridKey]) {
        clusters[gridKey] = { count: 0, lat: 0, lng: 0, captures: [] };
      }
      
      clusters[gridKey].count++;
      clusters[gridKey].lat += lat;
      clusters[gridKey].lng += lng;
      clusters[gridKey].captures.push(capture);
    });

    return Object.values(clusters)
      .filter(c => c.count >= 3)
      .map(c => ({
        count: c.count,
        lat: c.lat / c.count,
        lng: c.lng / c.count,
        captures: c.captures
      }));
  }, [validCaptures]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(mapCenter, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, 13);
    }
  }, [mapCenter]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setLoadingLocation(false);
        },
        (error) => {
          console.log('Could not get user location:', error);
          setLoadingLocation(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const marker = L.marker(userLocation)
        .bindPopup('<div class="text-center"><strong>Din plats</strong></div>')
        .addTo(mapRef.current);
      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update capture markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredCaptures.forEach(capture => {
      if (!capture.latitude || !capture.longitude) return;

      const lat = Number(capture.latitude);
      const lng = Number(capture.longitude);

      const marker = L.marker([lat, lng])
        .bindPopup(`
          <div class="space-y-2">
            <h4 class="font-semibold">${capture.ai_analysis?.species?.commonName || 'Okänd'}</h4>
            ${capture.ai_analysis?.species?.commonName ? `<p class="text-sm italic">${capture.ai_analysis.species.scientificName}</p>` : ''}
            ${capture.location_name ? `<p class="text-sm">📍 ${capture.location_name}</p>` : ''}
            ${capture.captured_at ? `<p class="text-xs text-muted-foreground">${new Date(capture.captured_at).toLocaleDateString('sv-SE')}</p>` : ''}
          </div>
        `)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Add hotspot markers
    hotspots.forEach((hotspot) => {
      const hotspotMarker = L.marker([hotspot.lat, hotspot.lng], {
        icon: L.divIcon({
          className: 'custom-hotspot-marker',
          html: `<div style="
            background: hsl(var(--warning));
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${hotspot.count}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      })
        .bindPopup(`
          <div class="space-y-2">
            <h4 class="font-semibold">🔥 Hotspot</h4>
            <p class="text-sm text-muted-foreground">${hotspot.count} fångster i detta område</p>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              ${hotspot.captures.slice(0, 5).map(c => `<p class="text-xs">• ${c.ai_analysis?.species?.commonName || 'Okänd'}</p>`).join('')}
              ${hotspot.captures.length > 5 ? `<p class="text-xs text-muted-foreground">+${hotspot.captures.length - 5} fler</p>` : ''}
            </div>
          </div>
        `)
        .addTo(mapRef.current!);

      markersRef.current.push(hotspotMarker);
    });
  }, [filteredCaptures, hotspots]);

  const centerOnUser = useCallback(() => {
    if (userLocation) {
      setMapCenter(userLocation);
    } else if (navigator.geolocation && !loadingLocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setLoadingLocation(false);
        },
        (error) => {
          console.log('Could not get user location:', error);
          setLoadingLocation(false);
        }
      );
    }
  }, [userLocation, loadingLocation]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLocation('all');
  };

  if (isLoading) {
    console.log('[Map] Loading state');
    return <MapSkeleton />;
  }

  if (error) {
    console.error('[Map] Error state:', error);
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <div className="space-y-2">
            <p className="font-medium">Kunde inte ladda karta</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Ett okänt fel uppstod"}
            </p>
          </div>
          <Button onClick={() => refetch()}>Försök igen</Button>
        </div>
      </div>
    );
  }

  if (validCaptures.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <div className="text-6xl">🗺️</div>
          <h2 className="text-xl font-semibold">Inga platser att visa</h2>
          <p className="text-muted-foreground">Fångster med platsdata kommer att visas här på kartan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pt-16 pb-20 bg-background">
      {/* Filter Bar */}
      <div className="absolute top-16 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-sm border-b p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Filter ({filteredCaptures.length}/{validCaptures.length})
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filtrera fångster</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla kategorier</SelectItem>
                      {categories.map(cat => {
                        const display = MAIN_CATEGORY_DISPLAY[cat as keyof typeof MAIN_CATEGORY_DISPLAY];
                        return (
                          <SelectItem key={cat} value={cat || ''}>
                            {display ? `${display.icon} ${display.name}` : cat}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plats</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj plats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla platser</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc || ''}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedCategory !== 'all' || selectedLocation !== 'all') && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Rensa filter
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="icon" onClick={centerOnUser}>
            <Locate className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{filteredCaptures.length} fångster</Badge>
          {hotspots.length > 0 && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              {hotspots.length} hotspots
            </Badge>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default Map;
