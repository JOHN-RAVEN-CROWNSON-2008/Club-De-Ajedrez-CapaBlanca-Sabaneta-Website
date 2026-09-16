import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto 5182: Portal de Afiliados y Alumnos del Club
export default defineConfig({
  plugins: [react()],
  define: {
    '__APP_TARGET_PORT__': 5182,
    '__APP_DEFAULT_ROUTE__': '"/afiliados"',
  },
  server: {
    port: 5182,
    strictPort: true,
    open: false,
  },
});
