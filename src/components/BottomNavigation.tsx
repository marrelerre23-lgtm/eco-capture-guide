import { NavLink } from "react-router-dom";
import { BarChart3, Camera, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNativeApp, getAdMobBannerHeight } from "@/utils/admob-native";
import { useSubscription } from "@/hooks/useSubscription";

const BottomNavigation = () => {
  const { subscription } = useSubscription();
  
  // Calculate if we need to add padding for native banner ad
  const shouldAddBannerPadding = isNativeApp() && subscription?.tier === 'free';
  const bannerHeight = shouldAddBannerPadding ? getAdMobBannerHeight() : 0;
  
  const navItems = [
    {
      to: "/",
      icon: BarChart3,
      label: "Översikt",
    },
    {
      to: "/camera",
      icon: Camera,
      label: "Kamera",
      isCamera: true,
    },
    {
      to: "/logbook",
      icon: BookOpen,
      label: "Loggbok",
    },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border"
      style={{ paddingBottom: `${bannerHeight}px` }}
    >
      <div className="flex items-center justify-around p-2 h-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors",
                item.isCamera && "flex-initial"
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.isCamera ? (
                  <Button
                    size="icon"
                    className="w-14 h-14 rounded-full bg-accent hover:bg-accent-light shadow-eco"
                  >
                    <item.icon className="h-6 w-6 text-accent-foreground" />
                  </Button>
                ) : (
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                )}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    item.isCamera
                      ? "text-accent"
                      : isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export { BottomNavigation };