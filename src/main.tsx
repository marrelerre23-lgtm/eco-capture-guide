import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Version marker for cache busting - forcing rebuild
console.log("EcoCapture v1.0.2 - Preview cache cleared");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
