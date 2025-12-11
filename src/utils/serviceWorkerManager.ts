/**
 * Service Worker Management Utilities
 */

const checkForMultipleReactInstances = (): boolean => {
  const reactCount = document.querySelectorAll('script[src*="react"]').length;
  if (reactCount > 2) {
    console.warn(`[Debug] ⚠️ Multiple React instances detected (${reactCount} scripts)`);
    return true;
  }
  return false;
};

export const logAppDiagnostics = (): void => {
  console.group('[Diagnostics] App Environment');
  console.log('React version:', (window as any).React?.version || 'unknown');
  console.log('Leaflet available:', typeof (window as any).L !== 'undefined');
  console.log('Leaflet version:', (window as any).L?.version || 'not loaded');
  console.log('Service Worker support:', 'serviceWorker' in navigator);
  console.log('Cache API support:', 'caches' in window);
  console.log('Online status:', navigator.onLine);
  checkForMultipleReactInstances();
  console.groupEnd();
};
