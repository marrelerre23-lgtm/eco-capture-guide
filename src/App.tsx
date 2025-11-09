import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RouterSafeLayout } from "./components/RouterSafeLayout";
import Overview from "./pages/Overview";
import Camera from "./pages/Camera";
import Logbook from "./pages/Logbook";
import Auth from "./pages/Auth";
import AnalysisResult from "./pages/AnalysisResult";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <RouterSafeLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/analysis-result" element={<AnalysisResult />} />
        <Route path="/logbook" element={<Logbook />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RouterSafeLayout>
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
