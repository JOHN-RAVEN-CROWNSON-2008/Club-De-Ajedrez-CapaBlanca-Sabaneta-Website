import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
  },
});
