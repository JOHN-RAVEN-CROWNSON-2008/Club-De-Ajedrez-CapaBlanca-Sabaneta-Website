import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto 5180: Web Pública abierta al público (Landing page y secciones del club)
export default defineConfig({
  plugins: [react()],
  cacheDir: 'node_modules/.vite_public',
  define: {
    '__APP_TARGET_PORT__': 5180,
    '__APP_DEFAULT_ROUTE__': '"/"',
  },
  server: {
    port: 5180,
    strictPort: true,
    open: false,
  },
});
