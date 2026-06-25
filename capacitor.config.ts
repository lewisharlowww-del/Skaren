import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'no.skaren.app',
  appName: 'Skaren',
  webDir: 'out',
  server: {
    url: 'https://skaren.app',
    cleartext: false,
  },

  ios: {
    contentInset: 'never',
    backgroundColor: '#faf7f2',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#ede9e2',
    },
  },
};

export default config;
