import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/rayride-insights/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
