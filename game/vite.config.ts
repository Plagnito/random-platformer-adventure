import { defineConfig } from 'vite';

// base './' : la pièce est servie sous /a/<slug>/ — chemins relatifs obligatoires.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
  },
});
