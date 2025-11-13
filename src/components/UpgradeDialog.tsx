import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, Zap, TrendingUp, BarChart3, Map, Download, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from './ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      
      console.log('🚀 Starting Stripe checkout...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att uppgradera');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Checkout error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('Ingen checkout-URL mottagen från servern');
      }

      console.log('✅ Checkout URL received, redirecting...');
      
      // Open checkout in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Omdirigerar till betalning",
        description: "Stripe Checkout öppnas i en ny flik",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        variant: 'destructive',
        title: "Kunde inte starta betalning",
        description: error instanceof Error ? error.message : "Ett okänt fel uppstod",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const features = [
    { icon: Sparkles, title: 'Obegränsade AI-analyser', description: 'Analysera hur många arter du vill' },
    { icon: Zap, title: 'Ingen annonser', description: 'Njut av en helt annonsfri upplevelse' },
    { icon: Download, title: 'Obegränsat antal fångster', description: 'Spara hur många fångster du vill' },
    { icon: BarChart3, title: 'Avancerad statistik', description: 'Djupgående insikter om dina upptäckter' },
    { icon: Map, title: 'Community Heatmaps', description: 'Se var andra hittat sällsynta arter' },
    { icon: TrendingUp, title: 'Offline-läge', description: 'Ladda ner databaser för användning utan internet' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-warning/20 to-accent/20 p-4 rounded-full">
              <Sparkles className="h-12 w-12 text-warning" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Uppgradera till Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            Få obegränsad tillgång till alla funktioner
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Toggle */}
        <div className="my-6">
          <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'monthly' | 'yearly')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">
                Månadsvis
              </TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Årlig
                <Badge className="ml-2 bg-success text-white text-xs">-17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Display */}
        <div className="bg-gradient-to-r from-warning/10 to-accent/10 rounded-lg p-6 border-2 border-warning/20 mb-6">
          <div className="text-center">
            {selectedPlan === 'monthly' ? (
              <>
                <div className="text-4xl font-bold text-foreground mb-2">
                  99 kr
                  <span className="text-lg font-normal text-muted-foreground">/månad</span>
                </div>
                <p className="text-sm text-muted-foreground">Faktureras månadsvis</p>
              </>
            ) : (
              <>
                <div className="text-4xl font-bold text-foreground mb-2">
                  990 kr
                  <span className="text-lg font-normal text-muted-foreground">/år</span>
                </div>
                <p className="text-sm text-success font-semibold mb-1">Spara 198 kr per år!</p>
                <p className="text-xs text-muted-foreground">Motsvarar 82,50 kr/månad</p>
              </>
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-4 mb-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="h-5 w-5 text-success flex-shrink-0" />
              </div>
            );
          })}
        </div>

        <Button 
          onClick={handleUpgrade} 
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-warning to-accent hover:from-warning/90 hover:to-accent/90"
          disabled={isUpgrading}
        >
          {isUpgrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Laddar...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Börja din {selectedPlan === 'monthly' ? 'månads' : 'års'}prenumeration
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Avsluta när som helst. Ingen bindningstid.
        </p>
      </DialogContent>
    </Dialog>
  );
};
