import { useState, useEffect, useMemo, ReactNode } from "react";
import { TopNavigation } from "./TopNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "./OfflineIndicator";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useQueryClient } from "@tanstack/react-query";
import { analytics } from "@/utils/analytics";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Background sync for offline captures
  useBackgroundSync();
  
  // Pages where navigation should be hidden
  const hideNavigation = location.pathname === "/camera" || location.pathname === "/auth" || location.pathname === "/analysis-result";

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);

        // Invalidate/clear queries on auth state changes
        if (event === 'SIGNED_IN') {
          queryClient.invalidateQueries();
          if (session?.user) {
            analytics.setUserId(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }

        // Redirect authenticated users away from auth page
        if (session?.user && location.pathname === "/auth") {
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to auth if not authenticated and not on public pages
  useEffect(() => {
    const publicRoutes = ["/auth", "/forgot-password"];
    if (!loading && !user && !publicRoutes.includes(location.pathname)) {
      navigate("/auth");
    }
  }, [user, loading, location.pathname, navigate]);

  // Derive unverified email from existing user state — no extra API call
  const unverifiedEmail = useMemo(() => {
    if (user && !user.email_confirmed_at) return user.email ?? undefined;
    return undefined;
  }, [user]);

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
      {unverifiedEmail && <EmailVerificationBanner userEmail={unverifiedEmail} />}
      {!hideNavigation && <TopNavigation user={user} onLogout={handleLogout} />}
      <main className={hideNavigation ? "" : "pt-16 pb-20"}>
        {children}
      </main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;
