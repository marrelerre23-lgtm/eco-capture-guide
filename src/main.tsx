import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logAppDiagnostics } from "./utils/serviceWorkerManager";

const APP_VERSION = '1.0.5';

console.log(`🚀 EcoCapture v${APP_VERSION} starting...`);
logAppDiagnostics();

// Log Service Worker status
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log(`[SW] Active service workers: ${registrations.length}`);
    registrations.forEach((reg, i) => {
      console.log(`[SW] ${i + 1}. Scope: ${reg.scope}, State: ${reg.active?.state}`);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <App />
);
