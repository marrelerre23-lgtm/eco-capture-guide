import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Leaf, Camera, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useSpeciesCaptures } from "@/hooks/useSpeciesCaptures";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const Overview = () => {
  const { data: captures, isLoading, error, refetch } = useSpeciesCaptures();

  // Calculate statistics from real data
  const statistics = useMemo(() => {
    if (!captures || captures.length === 0) {
      return {
        totalCaptures: 0,
        uniqueSpecies: 0,
        rareFinds: 0,
        locations: 0,
        latestCapture: null,
        recentActivity: []
      };
    }

    // Sort captures by date (newest first)
    const sortedCaptures = [...captures].sort((a, b) => 
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    );

    // Calculate unique species
    const uniqueSpeciesNames = new Set(
      captures
        .map(c => c.ai_analysis?.species?.commonName)
        .filter(Boolean)
    );

    // Calculate rare finds (based on rarity level only)
    const rareFinds = captures.filter(c => {
      const rarity = c.ai_analysis?.species?.rarity?.toLowerCase();
      return rarity && (rarity.includes('sällsynt') || rarity.includes('ovanlig') || rarity.includes('rare'));
    });

    // Calculate unique locations
    const uniqueLocations = new Set(
      captures
        .map(c => c.location_name)
        .filter(Boolean)
    );

    return {
      totalCaptures: captures.length,
      uniqueSpecies: uniqueSpeciesNames.size,
      rareFinds: rareFinds.length,
      locations: uniqueLocations.size,
      latestCaptures: sortedCaptures.slice(0, 5), // Get the 5 most recent captures
      recentActivity: sortedCaptures.slice(0, 3)
    };
  }, [captures]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Laddar översikt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16 flex items-center justify-center">
        <div className="text-center space-y-4 p-4">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <div className="space-y-2">
            <p className="font-medium">Kunde inte ladda översikt</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Ett okänt fel uppstod"}
            </p>
          </div>
          <Button onClick={() => refetch()}>Försök igen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Latest Captures Carousel */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Senaste fångsterna</h2>
          {statistics.latestCaptures && statistics.latestCaptures.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {statistics.latestCaptures.map((capture) => (
                  <CarouselItem key={capture.id}>
                    <Card className="overflow-hidden shadow-card">
                      <div className="aspect-square relative bg-gradient-earth">
                        <img 
                          src={capture.image_url}
                          alt={capture.ai_analysis?.species?.commonName || "Capture"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h3 className="text-white font-medium">
                            {capture.ai_analysis?.species?.commonName || "Okänd art"}
                          </h3>
                          <p className="text-white/80 text-sm">
                            {capture.ai_analysis?.species?.scientificName || "Okänd"}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-white/60" />
                            <span className="text-white/60 text-xs">
                              Fångad {new Date(capture.captured_at).toLocaleDateString('sv-SE', { 
                                day: 'numeric', 
                                month: 'long' 
                              })}, kl. {new Date(capture.captured_at).toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          ) : (
            <Card className="overflow-hidden shadow-card">
              <div className="aspect-square relative bg-muted flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Inga fångster än</p>
                  <p className="text-sm text-muted-foreground">Ta din första bild för att komma igång!</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Statistik</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{statistics.totalCaptures}</p>
                    <p className="text-sm text-muted-foreground">Totalt fångade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Leaf className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{statistics.uniqueSpecies}</p>
                    <p className="text-sm text-muted-foreground">Unika arter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Trophy className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{statistics.rareFinds}</p>
                    <p className="text-sm text-muted-foreground">Sällsynta fynd</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{statistics.locations}</p>
                    <p className="text-sm text-muted-foreground">Platser</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Senaste aktivitet</h2>
          <div className="space-y-2">
            {statistics.recentActivity.length > 0 ? statistics.recentActivity.map((capture, index) => {
              const species = capture.ai_analysis?.species;
              const rarity = species?.rarity?.toLowerCase();
              const isRare = rarity && (rarity.includes('sällsynt') || rarity.includes('ovanlig') || rarity.includes('rare'));
              
              return (
                <Card key={capture.id} className="shadow-card">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {species?.commonName || "Okänd art"}
                          </h4>
                          {isRare && (
                            <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">
                              Sällsynt
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          {species?.scientificName || "Okänd"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(capture.captured_at).toLocaleDateString('sv-SE', { 
                            day: 'numeric', 
                            month: 'long' 
                          })} kl. {new Date(capture.captured_at).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                        {capture.image_url ? (
                          <img 
                            src={capture.image_url} 
                            alt={species?.commonName || "Capture"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Leaf className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p>Inga fångster att visa</p>
                <p className="text-sm">Börja utforska och fånga arter!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;