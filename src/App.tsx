import { useState, useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { EmailVerificationBanner } from "./components/EmailVerificationBanner";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { supabase } from "./integrations/supabase/client";
import { analytics, ANALYTICS_EVENTS } from "./utils/analytics";

// Lazy load ALL pages to reduce initial bundle size and unused JS
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
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

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

  useEffect(() => {
    analytics.init();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        analytics.setUserId(user.id);
      }
    });
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
