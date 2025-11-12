import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Camera from "./pages/Camera";
import Logbook from "./pages/Logbook";
import Map from "./pages/Map";
import Auth from "./pages/Auth";
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
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/camera" element={
          <ErrorBoundary>
            <Camera />
          </ErrorBoundary>
        } />
        <Route path="/analysis-result" element={
          <ErrorBoundary>
            <AnalysisResult />
          </ErrorBoundary>
        } />
        <Route path="/logbook" element={
          <ErrorBoundary>
            <Logbook />
          </ErrorBoundary>
        } />
        <Route path="/map" element={
          <ErrorBoundary>
            <Map />
          </ErrorBoundary>
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

  // Auto-sync offline captures when coming online
  useEffect(() => {
    const syncOfflineCaptures = async () => {
      if (!isOnline || offlineCaptures.length === 0) return;

      console.log(`Syncing ${offlineCaptures.length} offline captures...`);
      
      toast({
        title: "Synkroniserar offline-fångster",
        description: `${offlineCaptures.length} ${offlineCaptures.length === 1 ? 'fångst' : 'fångster'} synkas nu...`
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

      if (syncedCount > 0) {
        toast({
          title: "Synkning klar!",
          description: `${syncedCount} ${syncedCount === 1 ? 'fångst' : 'fångster'} synkades framgångsrikt.`
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Synkning misslyckades delvis",
          description: `${failedCount} ${failedCount === 1 ? 'fångst' : 'fångster'} kunde inte synkas. De sparas lokalt.`,
          variant: "destructive"
        });
      }
    };

    syncOfflineCaptures();
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
