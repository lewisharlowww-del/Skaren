import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'no.skaren.app',
  appName: 'Skaren',
  webDir: 'out',
  server: {
    // Point to the live Vercel deployment so all API routes work natively
    url: 'https://skaren.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#faf7f2',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
