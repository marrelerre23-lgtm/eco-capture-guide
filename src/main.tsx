import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 EcoCapture v1.0.3 starting...");
console.log("📦 Preview cache cleared");

createRoot(document.getElementById("root")!).render(
  <App />
);
