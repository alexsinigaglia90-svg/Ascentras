import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/operis/control-room-planning/',
  build: {
    outDir: '../operis/control-room-planning',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          /* Separate Three.js core (~600KB) from app code */
          three: ['three'],
          /* R3F ecosystem in its own chunk */
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          /* State management */
          zustand: ['zustand'],
        },
      },
    },
    /* Raise warning limit — Three.js is inherently large */
    chunkSizeWarningLimit: 800,
  },
});
