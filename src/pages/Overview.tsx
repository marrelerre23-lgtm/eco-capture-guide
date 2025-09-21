import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Leaf, Camera, MapPin } from "lucide-react";
import blueberryPlant from "@/assets/blueberry-plant.jpg";

const Overview = () => {
  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-6">
        {/* Latest Capture */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Senaste fångsten</h2>
          <Card className="overflow-hidden shadow-card">
            <div className="aspect-square relative bg-gradient-earth">
              <img 
                src={blueberryPlant}
                alt="Latest capture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="text-white font-medium">Blåbärsris</h3>
                <p className="text-white/80 text-sm">Vaccinium myrtillus</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-white/60" />
                  <span className="text-white/60 text-xs">Fångad idag, 14:32</span>
                </div>
              </div>
            </div>
          </Card>
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
                    <p className="text-2xl font-bold text-foreground">127</p>
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
                    <p className="text-2xl font-bold text-foreground">42</p>
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
                    <p className="text-2xl font-bold text-foreground">8</p>
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
                    <p className="text-2xl font-bold text-foreground">15</p>
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
            {[
              { name: "Blåbärsris", species: "Vaccinium myrtillus", time: "Idag 14:32", rare: false },
              { name: "Kantarell", species: "Cantharellus cibarius", time: "Igår 16:15", rare: true },
              { name: "Gran", species: "Picea abies", time: "2 dagar sedan", rare: false },
            ].map((item, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        {item.rare && (
                          <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">
                            Sällsynt
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground italic">{item.species}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;