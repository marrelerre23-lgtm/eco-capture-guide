import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sun, Moon, User, Leaf, MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface TopNavigationProps {
  user: SupabaseUser | null;
  onLogout: () => void;
}

export const TopNavigation = ({ user, onLogout }: TopNavigationProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between p-4 h-16">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-eco">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">EcoCapture</h1>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          {/* Map Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/map')}
            className="rounded-full"
            aria-label="Visa karta"
          >
            <MapPin className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border border-border">
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Inloggad som</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profil & inställningar</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={onLogout}
              >
                <span>Logga ut</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};