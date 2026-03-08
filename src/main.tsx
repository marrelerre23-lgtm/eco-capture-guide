import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.DEV) {
  const { logAppDiagnostics } = await import("./utils/serviceWorkerManager");
  logAppDiagnostics();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`[SW] Active service workers: ${registrations.length}`);
      registrations.forEach((reg, i) => {
        console.log(`[SW] ${i + 1}. Scope: ${reg.scope}, State: ${reg.active?.state}`);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <App />
);
