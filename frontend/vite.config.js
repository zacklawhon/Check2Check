import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the new section to add
    proxy: {
      // Any request that starts with "/api" will be proxied
      '/api': {
        // --- IMPORTANT ---
        // Replace this with the actual URL of your Laragon project
        target: 'http://localhost:8080', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
});