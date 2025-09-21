import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SpeciesModal } from "@/components/SpeciesModal";
import amanitaPantherina from "@/assets/amanita-pantherina.jpg";
import entolomaNidorosum from "@/assets/entoloma-nidorosum.jpg";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: string;
  description: string;
  facts: {
    icon: string;
    title: string;
    description: string;
  }[];
}

const mockSpecies: Species[] = [
  {
    id: "1",
    name: "Fläckskivling",
    scientificName: "Amanita pantherina",
    image: amanitaPantherina,
    dateFound: "Fångad 8 september 2025, kl. 13:33",
    description: "Fläckskivling är en giftsvamp som tillhör familjen Amanitaceae. Den kännetecknas av sin grå till brunaktiga hatt med vita fläckar.",
    facts: [
      {
        icon: "✨",
        title: "Visste du att?",
        description: "Fläckskivling är giftig och kan förväxlas med ätliga svampar. Den innehåller samma toxiner som flugsvamp."
      },
      {
        icon: "⚖️",
        title: "Uppskattad ålder",
        description: "Ett ungt exemplar, sannolikt under 2 år."
      },
      {
        icon: "💚",
        title: "Hälsobedömning",
        description: "Svampen ser frisk ut men bör aldrig konsumeras på grund av sin giftighet."
      }
    ],
  },
  {
    id: "2",
    name: "Rosenticka",
    scientificName: "Entoloma nidorosum",
    image: entolomaNidorosum,
    dateFound: "Fångad 7 september 2025, kl. 15:20",
    description: "Rosenticka är en mindre svamp med karakteristiska rosa lameller och en mild doft.",
    facts: [
      {
        icon: "🌸",
        title: "Visste du att?",
        description: "Rosentickan får sitt namn från de vackra rosa lamellerna som utvecklas när svampen mognar."
      },
      {
        icon: "⚖️",
        title: "Uppskattad ålder",
        description: "Ett moget exemplar, cirka 3-4 dagar gammalt."
      },
      {
        icon: "💚",
        title: "Hälsobedömning",
        description: "Svampen är i god kondition utan synliga skador eller parasiter."
      }
    ],
  },
];

const categories = [
  { name: "Växt", count: 24, icon: "🌿", species: [] },
  { name: "Svamp", count: 12, icon: "🍄", species: mockSpecies },
  { name: "Träd", count: 8, icon: "🌳", species: [] },
  { name: "Insekt", count: 15, icon: "🦋", species: [] },
];

const Logbook = () => {
  const [expandedCategory, setExpandedCategory] = useState<string>("Svamp");
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? "" : categoryName);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Min Loggbok</h1>
          <p className="text-muted-foreground">
            En översikt av alla dina upptäckter. Klicka på en bild för detaljer.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.name}>
              {/* Category Header */}
              <Card 
                className="cursor-pointer shadow-card hover:shadow-eco transition-shadow"
                onClick={() => toggleCategory(category.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {category.count}
                      </Badge>
                      {expandedCategory === category.name ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Species Grid */}
              {expandedCategory === category.name && category.species.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {category.species.map((species) => (
                    <Card 
                      key={species.id}
                      className="cursor-pointer shadow-card hover:shadow-eco transition-all overflow-hidden"
                      onClick={() => setSelectedSpecies(species)}
                    >
                      <div className="aspect-square relative">
                        <img 
                          src={species.image}
                          alt={species.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <h4 className="text-white font-medium text-sm">{species.name}</h4>
                          <p className="text-white/80 text-xs italic">{species.scientificName}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Species Modal */}
      {selectedSpecies && (
        <SpeciesModal
          species={selectedSpecies}
          isOpen={!!selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
        />
      )}
    </div>
  );
};

export default Logbook;