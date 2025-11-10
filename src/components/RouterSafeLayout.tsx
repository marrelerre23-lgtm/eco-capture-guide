import { useState, useEffect, ReactNode } from "react";
import Layout from "./Layout";

interface RouterSafeLayoutProps {
  children: ReactNode;
}

/**
 * Ensures router context is fully initialized before rendering Layout.
 * This prevents "Cannot read properties of null (reading 'useContext')" errors
 * that occur when components try to use router hooks before the context is ready.
 */
export const RouterSafeLayout = ({ children }: RouterSafeLayoutProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for next tick to ensure router context is fully established
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};
