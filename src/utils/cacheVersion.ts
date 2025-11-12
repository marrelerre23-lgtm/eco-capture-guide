/**
 * Cache version management for forcing updates
 */

const CURRENT_VERSION = '1.0.7';
const VERSION_KEY = 'app_version';

export const checkAndUpdateVersion = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== CURRENT_VERSION) {
    console.log(`🔄 Version mismatch: ${storedVersion} -> ${CURRENT_VERSION}`);
    console.log('Clearing caches...');
    
    // Clear localStorage except critical data
    const keysToPreserve = ['onboarding_complete', 'has_analyzed', 'cookie_consent'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Update version
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          console.log(`Clearing cache: ${name}`);
          caches.delete(name);
        });
      });
    }
    
    console.log('✅ Cache cleared, reloading...');
    
    // Force reload from server
    window.location.reload();
  } else {
    console.log(`✅ Version ${CURRENT_VERSION} is current`);
  }
};

export const getCurrentVersion = () => CURRENT_VERSION;
