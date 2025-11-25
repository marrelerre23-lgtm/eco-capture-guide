import { Crown, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { useState, useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// #23: Animated counter component
const AnimatedCounter = ({ value, duration = 500 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue === value) return;

    const diff = value - prevValue;
    const steps = 20;
    const stepValue = diff / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(prevValue + stepValue * currentStep));
      }
    }, stepDuration);

    prevValueRef.current = value;
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="tabular-nums">{displayValue}</span>;
};

export const SubscriptionBanner = () => {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Laddar...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">
            Kunde inte ladda information: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  // Show simple stats banner
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Min Statistik</h3>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sparade fångster</span>
              <span className="font-medium">
                <AnimatedCounter value={subscription.capturesCount} /> / {subscription.maxCaptures}
              </span>
            </div>
            <Progress 
              value={(subscription.capturesCount / (subscription.maxCaptures || 500)) * 100} 
              className="h-2"
            />
            {subscription.capturesCount >= (subscription.maxCaptures || 500) - 50 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Du närmar dig lagringsgränsen ({subscription.maxCaptures} fångster)
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
