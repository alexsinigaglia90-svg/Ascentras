import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/operis/control-room-planning/',
  build: {
    outDir: '../operis/control-room-planning',
    emptyOutDir: true,
  },
});
