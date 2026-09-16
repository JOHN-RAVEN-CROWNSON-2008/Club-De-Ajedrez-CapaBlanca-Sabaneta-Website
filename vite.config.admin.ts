import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto 5181: Panel de Administrador y CMS
export default defineConfig({
  plugins: [react()],
  cacheDir: 'node_modules/.vite_admin',
  define: {
    '__APP_TARGET_PORT__': 5181,
    '__APP_DEFAULT_ROUTE__': '"/admin"',
  },
  server: {
    port: 5181,
    strictPort: true,
    open: false,
  },
});
