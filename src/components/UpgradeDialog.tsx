import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting Stripe checkout...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Du måste vara inloggad för att uppgradera');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Uppgradera till Premium
          </DialogTitle>
          <DialogDescription>
            Lås upp alla funktioner och få obegränsad access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {[
              'Obegränsade AI-analyser',
              'Inga annonser',
              'Obegränsat antal fångster',
              'Export till PDF',
              'Avancerad statistik',
              'Prioriterad support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">99 kr</div>
              <div className="text-sm text-muted-foreground">per månad</div>
            </div>

            <Button 
              onClick={handleUpgrade} 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Laddar...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Börja din Premium-prenumeration
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Avsluta när som helst. Ingen bindningstid.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
