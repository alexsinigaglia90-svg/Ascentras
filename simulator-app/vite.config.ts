import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/warehouse-simulator/',
  build: {
    outDir: '../warehouse-simulator',
    emptyOutDir: true
  }
});
