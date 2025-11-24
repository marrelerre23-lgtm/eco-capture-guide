import { Crown, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import { UpgradeDialog } from "./UpgradeDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const SubscriptionBanner = () => {
  const { subscription, loading, error } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Laddar prenumeration...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">
            Kunde inte ladda prenumeration: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Gratis Plan (Standard)</h3>
            </div>
            <Button 
              onClick={() => setUpgradeDialogOpen(true)}
              size="sm"
              variant="default"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Uppgradera
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show banner for premium users
  if (subscription.tier !== 'free') {
    return (
      <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Premium Aktiv</h3>
              <p className="text-xs text-muted-foreground">Obegränsade analyser & lagring</p>
            </div>
          </div>
          <Badge variant="default" className="bg-gradient-to-r from-primary to-accent border-0">
            {subscription.tier.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Show usage stats for free users
  const analysisPercentage = subscription.maxAnalysesPerDay 
    ? (subscription.analysesToday / subscription.maxAnalysesPerDay) * 100 
    : 0;
  
  const capturesPercentage = subscription.maxCaptures
    ? (subscription.capturesCount / subscription.maxCaptures) * 100
    : 0;

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Gratis Plan</h3>
            </div>
            <Button 
              onClick={() => setUpgradeDialogOpen(true)}
              size="sm"
              variant="default"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Uppgradera
            </Button>
          </div>

          {/* Daily Analyses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analyser idag</span>
              {/* FIX #7: Show breakdown directly for users with rewarded bonuses */}
              <span className="font-medium">
                {subscription.analysesToday}
                {' / '}
                {subscription.maxAnalysesPerDay + (subscription.rewardedAnalysesToday || 0)}
                {subscription.rewardedAnalysesToday > 0 && (
                  <span className="text-xs text-warning ml-1">
                    ({subscription.maxAnalysesPerDay} + {subscription.rewardedAnalysesToday} ★)
                  </span>
                )}
              </span>
            </div>
            <Progress value={analysisPercentage} className="h-2" />
            {subscription.isAnalysisLimitReached && (
              <p className="text-xs text-destructive">
                Daglig gräns nådd. Återställs vid midnatt eller titta på en annons för +5 extra.
              </p>
            )}
          </div>

          {/* Total Captures */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sparade fångster</span>
              <span className="font-medium">
                {subscription.capturesCount} / {subscription.maxCaptures}
              </span>
            </div>
            <Progress value={capturesPercentage} className="h-2" />
            {subscription.isCaptureLimitReached && (
              <p className="text-xs text-destructive">
                Lagringsgräns nådd. Uppgradera för mer utrymme.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Med Premium får du obegränsade analyser och lagring
            </p>
          </div>
        </CardContent>
      </Card>

      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </>
  );
};
