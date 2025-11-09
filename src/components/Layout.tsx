import { useState, useEffect, ReactNode } from "react";
import { TopNavigation } from "./TopNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "./OfflineIndicator";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Background sync for offline captures
  useBackgroundSync();
  
  // Pages where navigation should be hidden
  const hideNavigation = location.pathname === "/camera" || location.pathname === "/photo-preview" || location.pathname === "/auth" || location.pathname === "/analysis-result";

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect authenticated users away from auth page
        if (session?.user && location.pathname === "/auth") {
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  // Redirect to auth if not authenticated and not on auth page
  useEffect(() => {
    if (!loading && !user && location.pathname !== "/auth") {
      navigate("/auth");
    }
  }, [user, loading, location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <OfflineIndicator />
      {!hideNavigation && <TopNavigation user={user} onLogout={handleLogout} />}
      <main className={hideNavigation ? "" : "pt-16 pb-20"}>
        {children}
      </main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;