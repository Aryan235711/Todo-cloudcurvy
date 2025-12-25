import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.loop.todo',
  appName: 'Loop',
  webDir: 'dist',
  ios: {
    preferredContentMode: 'mobile'
  },
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: process.env.NODE_ENV === 'development',
        },
      }
    : {}),
};

export default config;
