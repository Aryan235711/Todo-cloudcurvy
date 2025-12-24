import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.curvycloud.todo',
  appName: 'CurvyCloud',
  webDir: 'dist',
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: process.env.NODE_ENV === 'development', // Only allow cleartext in dev
        },
      }
    : {}),
};

export default config;
