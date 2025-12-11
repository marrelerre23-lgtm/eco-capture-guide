import { useState, useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useOfflineStorage } from "./hooks/useOfflineStorage";
import { useToast } from "./hooks/use-toast";
import { supabase } from "./integrations/supabase/client";
import { analytics, ANALYTICS_EVENTS } from "./utils/analytics";

// Lazy load heavy pages to reduce initial bundle size
const Overview = lazy(() => import("./pages/Overview"));
const Camera = lazy(() => import("./pages/Camera"));
const Logbook = lazy(() => import("./pages/Logbook"));
const Map = lazy(() => import("./pages/Map"));
const AnalysisResult = lazy(() => import("./pages/AnalysisResult"));
const ProfileEnhanced = lazy(() => import("./pages/ProfileEnhanced"));
const Install = lazy(() => import("./pages/Install"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-muted" />
      <div className="h-4 w-32 rounded bg-muted" />
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <>
      <EmailVerificationBanner />
      <CookieConsent />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/camera" element={
            <RouteErrorBoundary routeName="Camera">
              <Camera />
            </RouteErrorBoundary>
          } />
          <Route path="/analysis-result" element={
            <RouteErrorBoundary routeName="Analysis Result">
              <AnalysisResult />
            </RouteErrorBoundary>
          } />
          <Route path="/logbook" element={
            <RouteErrorBoundary routeName="Logbook">
              <Logbook />
            </RouteErrorBoundary>
          } />
          <Route path="/map" element={
            <RouteErrorBoundary routeName="Map">
              <Map />
            </RouteErrorBoundary>
          } />
          <Route path="/profile" element={<ProfileEnhanced />} />
          <Route path="/install" element={<Install />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const isOnline = useOnlineStatus();
  const { offlineCaptures, removeOfflineCapture } = useOfflineStorage();
  const { toast } = useToast();

  useEffect(() => {
    analytics.init();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        analytics.setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      analytics.track(ANALYTICS_EVENTS.ONBOARDING_STARTED);
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    analytics.track(ANALYTICS_EVENTS.ONBOARDING_COMPLETED);
    setShowOnboarding(false);
  };

  useEffect(() => {
    const hasAnalyzed = localStorage.getItem('has_analyzed');
    if (hasAnalyzed && !showOnboarding) {
      const timer = setTimeout(() => setShowPWAPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  useEffect(() => {
    if (!isOnline || offlineCaptures.length === 0) return;

    const syncTimeout = setTimeout(async () => {
      const totalCaptures = offlineCaptures.length;
      
      toast({
        title: "Synkroniserar offline-fångster",
        description: `${totalCaptures} ${totalCaptures === 1 ? 'fångst' : 'fångster'} synkas nu...`
      });

      let syncedCount = 0;
      let failedCount = 0;

      for (const capture of offlineCaptures) {
        try {
          removeOfflineCapture(capture.id);
          syncedCount++;
        } catch (error) {
          console.error("Failed to sync capture:", capture.id, error);
          failedCount++;
        }
      }

      if (syncedCount > 0) {
        toast({
          title: "Synkning klar!",
          description: `${syncedCount} av ${totalCaptures} ${syncedCount === 1 ? 'fångst' : 'fångster'} synkades framgångsrikt.`
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Synkning misslyckades",
          description: `${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'} kunde inte synkas.`,
          variant: "destructive"
        });
      }
    }, 2000);

    return () => clearTimeout(syncTimeout);
  }, [isOnline, offlineCaptures, removeOfflineCapture, toast]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BrowserRouter>
            {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
            {showPWAPrompt && <PWAInstallPrompt />}
            <Layout>
              <AppRoutes />
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
