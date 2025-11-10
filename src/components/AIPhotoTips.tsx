import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Camera } from "lucide-react";

interface AIPhotoTipsProps {
  category: string;
  confidence: number;
}

const getCategoryTips = (category: string, confidence: number): string[] => {
  const categoryLower = category.toLowerCase();
  
  // Low confidence tips - encourage better photos
  if (confidence < 0.7) {
    const baseTips = [
      "📸 Ta flera bilder från olika vinklar för bättre identifiering",
      "💡 Använd bättre ljusförhållanden - undvik skuggor och motljus",
      "🔍 Kom närmare motivet för tydligare detaljer",
    ];
    
    if (categoryLower.includes('svamp')) {
      return [
        ...baseTips,
        "🍄 Fotografera undersidan (lameller/porer) tydligt",
        "🦵 Visa foten och hur den fäster vid marken",
      ];
    }
    
    if (categoryLower.includes('växt') || categoryLower.includes('blomma')) {
      return [
        ...baseTips,
        "🌸 Ta närbilder på blommor och bladens form",
        "🌿 Fotografera hur bladen sitter på stjälken",
      ];
    }
    
    if (categoryLower.includes('träd')) {
      return [
        ...baseTips,
        "🌳 Fotografera barken nära - textur är viktig",
        "🍂 Ta tydliga bilder på blad eller barr",
      ];
    }
    
    return baseTips;
  }
  
  // High confidence tips - share success and encourage documentation
  const successTips = [
    "✅ Bra fotograferat! AI:n kunde identifiera med hög säkerhet",
    "📝 Spara gärna bilden för framtida referens",
  ];
  
  if (categoryLower.includes('svamp')) {
    return [
      ...successTips,
      "🍄 Tips: Dokumentera alltid undersidan på svampar",
      "📍 Växtplatsen är viktig information för framtida fyndplatser",
    ];
  }
  
  if (categoryLower.includes('växt') || categoryLower.includes('blomma')) {
    return [
      ...successTips,
      "🌸 Tips: Fotografera blommor tidigt på säsongen",
      "📅 Notera blomningsperioden i dina anteckningar",
    ];
  }
  
  if (categoryLower.includes('träd')) {
    return [
      ...successTips,
      "🌳 Tips: Träd kan identifieras även vintertid via bark och grenstruktur",
      "🍂 Dokumentera säsongsförändringar för fullständig identifiering",
    ];
  }
  
  return successTips;
};

export const AIPhotoTips = ({ category, confidence }: AIPhotoTipsProps) => {
  const tips = getCategoryTips(category, confidence);
  
  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Lightbulb className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {confidence < 0.7 ? "Tips för bättre bilder" : "Fotograferingstips"}
          </h3>
        </div>
        
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className="text-xl flex-shrink-0 mt-0.5">{tip.split(' ')[0]}</span>
              <span className="text-muted-foreground leading-relaxed pt-1">
                {tip.split(' ').slice(1).join(' ')}
              </span>
            </li>
          ))}
        </ul>
        
        {confidence < 0.7 && (
          <div className="flex items-start gap-2 pt-2 border-t border-border">
            <Camera className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Följ tipsen ovan och ta en ny bild för högre säkerhet i identifieringen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
