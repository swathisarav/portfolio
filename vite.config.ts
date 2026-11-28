import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the docs/ folder of main at /portfolio/,
  // so `npm run build` writes the site straight there.
  base: '/portfolio/',
  build: { outDir: 'docs', emptyOutDir: true },
  plugins: [react(), tailwindcss()],
});
