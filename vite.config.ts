import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
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
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              capacitor: [
                '@capacitor/core',
                '@capacitor/haptics', 
                '@capacitor/preferences',
                '@capacitor/local-notifications',
                '@capacitor/push-notifications'
              ],
              ai: ['@google/genai'],
              icons: ['lucide-react'],
              // Separate notification services to resolve dynamic import warning
              notifications: ['./services/notificationService']
            }
          }
        },
        minify: true,
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
        // Asset optimization
        assetsInlineLimit: 4096, // Inline small assets as base64
        cssCodeSplit: true, // Split CSS for better caching
      }
    };
});
