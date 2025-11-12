import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkAndUpdateVersion } from "./utils/cacheVersion";

// Check version and clear cache if needed
console.log("🚀 EcoCapture starting...");
checkAndUpdateVersion();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
