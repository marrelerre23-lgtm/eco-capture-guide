import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Lightbulb, AlertCircle, Eye, Leaf, TreeDeciduous, Mountain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PhotoTipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
}

const GENERAL_TIPS = [
  { icon: "💡", text: "Använd naturligt dagsljus - undvik blixt och skuggor" },
  { icon: "🎯", text: "Håll motivet i fokus och centrera det i bilden" },
  { icon: "📏", text: "Fyll bildrutan med motivet - kom tillräckligt nära" },
  { icon: "📐", text: "Ta bilder från flera olika vinklar" },
  { icon: "🤚", text: "Håll telefonen stadigt för att undvika suddighet" },
  { icon: "🌤️", text: "Undvik motljus och för mörka förhållanden" },
];

const CATEGORY_SPECIFIC_TIPS: Record<string, Array<{ icon: string; text: string }>> = {
  mushroom: [
    { icon: "🍄", text: "Fotografera ovansidan (hatten) tydligt" },
    { icon: "📸", text: "Viktigast: Ta bild av undersidan (lameller/porer)" },
    { icon: "🦵", text: "Fota foten och dess fäste vid marken" },
    { icon: "🌲", text: "Visa växplatsen (skog, gräsmatta, ved, etc.)" },
    { icon: "📏", text: "Ta en närbild och en översiktsbild" },
  ],
  plant: [
    { icon: "🌸", text: "Fotografera blommorna tydligt om det finns" },
    { icon: "🍃", text: "Ta närbilder på bladens form och struktur" },
    { icon: "📍", text: "Fota stjälken och hur bladen sitter" },
    { icon: "🌿", text: "Visa hela växten om möjligt (växtsätt)" },
    { icon: "🏞️", text: "Inkludera omgivningen för växtplatsens kontext" },
  ],
  tree: [
    { icon: "🌳", text: "Fotografera barken nära - textur och färg är viktiga" },
    { icon: "🍂", text: "Ta tydliga bilder på blad eller barr" },
    { icon: "🌿", text: "Fota grenstrukturen och hur de växer" },
    { icon: "🎄", text: "Ta en översiktsbild av trädets form" },
    { icon: "🔍", text: "Om det finns frukter/kottar - fotografera dem" },
  ],
  moss: [
    { icon: "🔬", text: "Kom så nära som möjligt för att fånga strukturen" },
    { icon: "💚", text: "Fotografera färg och tillväxtmönster" },
    { icon: "🪨", text: "Visa vad mossan växer på (sten, träd, mark)" },
    { icon: "💧", text: "Notera om mossan är fuktig eller torr" },
    { icon: "📐", text: "Ta bilder både ovanifrån och från sidan" },
  ],
  stone: [
    { icon: "💎", text: "Fotografera från flera vinklar för att visa form" },
    { icon: "🎨", text: "Fånga färg och mönster tydligt" },
    { icon: "✨", text: "Ta närbilder på kristaller eller strukturer" },
    { icon: "🔍", text: "Fotografera både ytan och eventuella brott" },
    { icon: "📏", text: "Inkludera något för storleksreferens om möjligt" },
  ],
  berry: [
    { icon: "🫐", text: "Fotografera bären tydligt - färg är viktigt" },
    { icon: "🍃", text: "Ta bilder på bladens form och struktur" },
    { icon: "🌿", text: "Visa hur bären sitter på växten" },
    { icon: "📍", text: "Fota stammen/grenarna" },
    { icon: "🏞️", text: "Inkludera växplatsens omgivning" },
  ],
};

export const PhotoTipsDialog = ({ open, onOpenChange, category }: PhotoTipsDialogProps) => {
  const categoryTips = category ? CATEGORY_SPECIFIC_TIPS[category] : null;

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      mushroom: "Svamp",
      plant: "Växt",
      tree: "Träd",
      moss: "Mossa",
      stone: "Sten",
      berry: "Bär",
    };
    return names[cat] || cat;
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, ReactNode> = {
      mushroom: <Leaf className="h-5 w-5" />,
      plant: <Leaf className="h-5 w-5" />,
      tree: <TreeDeciduous className="h-5 w-5" />,
      moss: <Mountain className="h-5 w-5" />,
      stone: <Mountain className="h-5 w-5" />,
      berry: <Leaf className="h-5 w-5" />,
    };
    return icons[cat] || <Camera className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Camera className="h-6 w-6 text-primary" />
            Tips för bättre bilder
          </DialogTitle>
          <DialogDescription>
            Följ dessa tips för att AI:n ska kunna identifiera din fångst med högre säkerhet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* General Tips */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Allmänna fotograferingstips
            </h3>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {GENERAL_TIPS.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                      <span className="text-sm text-muted-foreground pt-1">{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Category-Specific Tips */}
          {categoryTips && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                {getCategoryIcon(category!)}
                Tips för {getCategoryName(category!)}
              </h3>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {categoryTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                        <span className="text-sm text-foreground pt-1 font-medium">{tip.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Important Notice */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-warning">Viktigt att komma ihåg</h4>
                  <p className="text-sm text-muted-foreground">
                    Ju bättre bilder du tar, desto högre säkerhet får AI:n i sin identifiering. Om flera arter får liknande säkerhetsprocent kan det bero på att bilden inte visar tillräckligt med detaljer för att särskilja dem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
