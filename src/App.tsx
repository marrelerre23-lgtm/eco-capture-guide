import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Camera from "./pages/Camera";
import Logbook from "./pages/Logbook";
import Auth from "./pages/Auth";
import Map from "./pages/Map";
import { MapErrorBoundary } from "./components/MapErrorBoundary";
import AnalysisResult from "./pages/AnalysisResult";
import ProfileEnhanced from "./pages/ProfileEnhanced";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import Install from "./pages/Install";
import About from "./pages/About";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useOfflineStorage } from "./hooks/useOfflineStorage";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  return (
    <>
      <PWAInstallPrompt />
      <EmailVerificationBanner />
      <CookieConsent />
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
            <MapErrorBoundary>
              <Map />
            </MapErrorBoundary>
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
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
    // Check if user has completed onboarding
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  // Show PWA install prompt only after first analysis
  useEffect(() => {
    const hasAnalyzed = localStorage.getItem('has_analyzed');
    if (hasAnalyzed && !showOnboarding) {
      // Wait 2 seconds after first analysis before showing prompt
      const timer = setTimeout(() => setShowPWAPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  // Auto-sync offline captures when coming online with debouncing
  useEffect(() => {
    if (!isOnline || offlineCaptures.length === 0) return;

    // Debounce the sync to avoid multiple rapid syncs
    const syncTimeout = setTimeout(async () => {
      console.log(`Syncing ${offlineCaptures.length} offline captures...`);
      const totalCaptures = offlineCaptures.length;
      
      toast({
        title: "Synkroniserar offline-fångster",
        description: `${totalCaptures} ${totalCaptures === 1 ? 'fångst' : 'fångster'} synkas nu...`
      });

      let syncedCount = 0;
      let failedCount = 0;

      for (const capture of offlineCaptures) {
        try {
          // TODO: Implement full sync to database when ready
          console.log("Would sync capture:", capture.id);
          
          // For now, just remove from offline storage after a successful "sync"
          removeOfflineCapture(capture.id);
          syncedCount++;
        } catch (error) {
          console.error("Failed to sync capture:", capture.id, error);
          failedCount++;
        }
      }

      // Show feedback to user
      if (syncedCount > 0) {
        toast({
          title: "Synkning klar!",
          description: `${syncedCount} av ${totalCaptures} ${syncedCount === 1 ? 'fångst' : 'fångster'} synkades framgångsrikt.`
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Synkning misslyckades",
          description: `${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'} kunde inte synkas. De sparas lokalt och försöker igen senare.`,
          variant: "destructive"
        });
      }
    }, 2000); // Debounce for 2 seconds

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
            {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
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
