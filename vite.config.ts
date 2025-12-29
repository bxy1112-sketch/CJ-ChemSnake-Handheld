import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 专用路径配置
  base: '/CJ-ChemSnake-Handheld/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});