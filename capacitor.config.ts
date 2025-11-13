import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.56a119db65174f22a5fe62ee00c11a56',
  appName: 'eco-capture-guide',
  webDir: 'dist',
  server: {
    url: 'https://56a119db-6517-4f22-a5fe-62ee00c11a56.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      showSpinner: false,
    },
  },
};

export default config;
