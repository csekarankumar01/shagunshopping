import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // In development the React app calls /api/... and Vite forwards it to Express,
      // so cookies work without any CORS pain.
      '/api': 'http://localhost:5001',
    },
  },
});
