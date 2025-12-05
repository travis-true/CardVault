import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base to './' for relative paths, which is often needed for GitHub Pages project sites
  base: './',
});