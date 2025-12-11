import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { X, Loader2, Trash2, MapPin, Calendar, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: string;
  description: string;
  ageStage?: string;
  category?: string;
  confidence?: number;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  gpsAccuracy?: number;
  notes?: string;
  facts: {
    icon: string;
    title: string;
    description: string;
  }[];
}

interface SpeciesModalProps {
  species: Species;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isAnalyzing?: boolean;
  isDeleting?: boolean;
  showActions?: boolean;
}

// Get confidence color class
const getConfidenceClass = (confidence: number): string => {
  if (confidence >= 0.8) return "confidence-high";
  if (confidence >= 0.5) return "confidence-medium";
  return "confidence-low";
};

// Get confidence label
const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return "Mycket säker";
  if (confidence >= 0.8) return "Säker";
  if (confidence >= 0.6) return "Trolig";
  if (confidence >= 0.4) return "Möjlig";
  return "Osäker";
};

// Format date for postmark
const formatPostmarkDate = (dateString: string): string => {
  const match = dateString.match(/(\d+)\s+(\w+)\s+(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${day} ${month.substring(0, 3).toUpperCase()} ${year}`;
  }
  return new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
};

// Get category icon
const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    'träd-ved': '🌳',
    'örter-blommor': '🌸',
    'mossor-lavar': '🌿',
    'svampar': '🍄',
    'fåglar': '🦅',
    'däggdjur': '🦌',
    'grod-kräldjur': '🦎',
    'insekter-spindlar': '🦋',
    'vatten-ryggradslösa': '🐚',
    'stenar-mineraler': '💎',
    'spår-övrigt': '🔍',
  };
  return icons[category?.toLowerCase() || ''] || '🌿';
};

export const SpeciesModal = ({ 
  species, 
  isOpen, 
  onClose, 
  onDelete, 
  isDeleting = false,
  showActions = false 
}: SpeciesModalProps) => {
  const [activeTab, setActiveTab] = useState("fakta");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize mini-map
  useEffect(() => {
    if (!isOpen || !mapRef.current || !species.coordinates) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { latitude, longitude } = species.coordinates;

    // Create map with expedition style
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });

    // Use a vintage/terrain style tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px; 
          height: 24px; 
          background: linear-gradient(135deg, hsl(0 65% 50%), hsl(0 70% 40%));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    L.marker([latitude, longitude], { icon: markerIcon }).addTo(map);

    // Accuracy circle
    if (species.gpsAccuracy) {
      L.circle([latitude, longitude], {
        radius: species.gpsAccuracy,
        color: 'hsl(150 60% 40%)',
        fillColor: 'hsl(150 60% 40%)',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, species.coordinates, species.gpsAccuracy]);

  const confidence = species.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col p-0 border-0 rounded-2xl shadow-2xl overflow-hidden paper-texture"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header with Postmark and Wax Seal */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              {/* Postmark Stamp */}
              <div className="postmark-stamp">
                <div className="flex flex-col items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  <span className="text-[10px] font-bold">{formatPostmarkDate(species.dateFound)}</span>
                  {species.location && (
                    <span className="text-[8px] opacity-75 max-w-[80px] truncate">{species.location}</span>
                  )}
                </div>
              </div>

              {/* Wax Seal with Category */}
              <div className="wax-seal">
                <span>{getCategoryIcon(species.category)}</span>
              </div>
            </div>
          </div>

          {/* Image Section with Polaroid + Mini Map */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Polaroid Image */}
              <div className="sm:col-span-3">
                <div className="polaroid-frame tape-effect">
                  <img 
                    src={species.image}
                    alt={species.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>

              {/* Mini Map */}
              <div className="sm:col-span-2 relative">
                {species.coordinates ? (
                  <div className="expedition-map h-full min-h-[140px] relative">
                    <div ref={mapRef} className="w-full h-full min-h-[140px]" />
                    {species.gpsAccuracy && (
                      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/70 px-2 py-1 rounded text-[10px] flex items-center gap-1 z-[1000]">
                        <Navigation className="h-3 w-3 text-primary" />
                        <span>±{Math.round(species.gpsAccuracy)}m</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="expedition-map h-full min-h-[140px] flex items-center justify-center bg-muted/50">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Ingen GPS-data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="px-6 pb-4 space-y-3">
            {/* Species Name - Handwritten style */}
            <div>
              <h2 className="font-handwritten text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {species.name}
              </h2>
              <p className="font-serif italic text-muted-foreground text-sm mt-1">
                {species.scientificName}
              </p>
            </div>

            {/* AI Confidence Bar */}
            {species.confidence !== undefined && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif text-muted-foreground">AI-säkerhet</span>
                  <span className="font-semibold text-foreground">
                    {confidencePercent}% – {getConfidenceLabel(confidence)}
                  </span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className={`confidence-bar-fill ${getConfidenceClass(confidence)}`}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Age Stage */}
            {species.ageStage && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🕐</span>
                <span className="font-serif text-muted-foreground">Uppskattad ålder:</span>
                <span className="font-medium text-foreground">{species.ageStage}</span>
              </div>
            )}
          </div>

          {/* Vintage Divider */}
          <div className="px-6 pb-4">
            <div className="vintage-divider">
              <span className="text-xs font-serif">✦</span>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="px-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="journal-tabs w-full bg-transparent p-0 h-auto gap-0">
                <TabsTrigger 
                  value="fakta" 
                  className={`journal-tab flex-1 rounded-none bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none ${activeTab === 'fakta' ? 'active' : ''}`}
                >
                  Fakta
                </TabsTrigger>
                <TabsTrigger 
                  value="anteckningar" 
                  className={`journal-tab flex-1 rounded-none bg-transparent shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none ${activeTab === 'anteckningar' ? 'active' : ''}`}
                >
                  Anteckningar
                </TabsTrigger>
              </TabsList>

              {/* Facts Tab */}
              <TabsContent value="fakta" className="mt-4 space-y-3 journal-entry">
                {/* Description */}
                <div className="fact-card">
                  <p className="font-serif text-sm leading-relaxed text-foreground">
                    {species.description}
                  </p>
                </div>

                {/* Facts Grid */}
                {species.facts.length > 0 && (
                  <div className="space-y-2">
                    {species.facts.map((fact, index) => (
                      <div key={index} className="fact-card">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">{fact.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-semibold text-sm text-primary mb-1">
                              {fact.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {fact.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="anteckningar" className="mt-4 journal-entry">
                <div className="lined-paper min-h-[150px] p-4 rounded-lg border border-border/50 bg-background/50">
                  {species.notes ? (
                    <p className="font-handwritten text-lg text-foreground whitespace-pre-wrap">
                      {species.notes}
                    </p>
                  ) : (
                    <p className="font-handwritten text-lg text-muted-foreground/50 italic">
                      Inga anteckningar tillagda ännu...
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        {showActions && onDelete && (
          <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
            <Button 
              onClick={onDelete} 
              variant="destructive" 
              className="w-full font-serif"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Tar bort..." : "Ta bort fångst"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
