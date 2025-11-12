/**
 * Service Worker Management Utilities
 * Handles SW registration, updates, and cache clearing
 */

export const unregisterAllServiceWorkers = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[SW] Found ${registrations.length} service worker(s) to unregister`);
    
    await Promise.all(
      registrations.map(registration => {
        console.log(`[SW] Unregistering: ${registration.scope}`);
        return registration.unregister();
      })
    );
    
    console.log('[SW] All service workers unregistered');
  } catch (error) {
    console.error('[SW] Error unregistering service workers:', error);
  }
};

export const clearAllCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    console.log('[Cache] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.log(`[Cache] Found ${cacheNames.length} cache(s) to clear:`, cacheNames);
    
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log(`[Cache] Deleting: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );
    
    console.log('[Cache] All caches cleared');
  } catch (error) {
    console.error('[Cache] Error clearing caches:', error);
  }
};

export const forceAppUpdate = async (): Promise<void> => {
  console.log('[Update] Starting forced app update...');
  
  // Clear all caches
  await clearAllCaches();
  
  // Unregister all service workers
  await unregisterAllServiceWorkers();
  
  // Clear storage
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('[Update] All data cleared, reloading...');
  
  // Force reload from server
  window.location.reload();
};

export const checkForMultipleReactInstances = (): boolean => {
  // Check if React is loaded multiple times
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
