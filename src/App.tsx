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
    <Layout>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/analysis-result" element={<AnalysisResult />} />
        <Route path="/logbook" element={<Logbook />} />
        <Route path="/map" element={<Map />} />
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
    </Layout>
  );
};

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

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
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
