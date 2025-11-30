import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.ecocapture.app',
  appName: 'EcoCapture',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10b981',
      showSpinner: false,
    },
  },
};

export default config;
