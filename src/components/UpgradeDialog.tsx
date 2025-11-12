import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const handleUpgrade = async () => {
    // TODO: Stripe checkout integration will be added here
    console.log('Redirect to Stripe checkout');
    // For now, just show a message
    alert('Betalningsintegration kommer snart!');
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

            <Button onClick={handleUpgrade} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Börja din Premium-prenumeration
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
