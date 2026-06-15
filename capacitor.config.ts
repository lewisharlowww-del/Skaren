import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'no.skaren.app',
  appName: 'Skaren',
  webDir: 'out',

  ios: {
    contentInset: 'never',
    backgroundColor: '#faf7f2',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ede9e2',
    },
  },
};

export default config;
