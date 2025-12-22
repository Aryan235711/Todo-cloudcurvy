import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Never embed a developer's personal API key into a production build.
    // BYOK keys should be provided by the user at runtime (stored on-device).
    const embeddedKey = mode === 'development' ? (env.GEMINI_API_KEY || '') : '';
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(embeddedKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(embeddedKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
