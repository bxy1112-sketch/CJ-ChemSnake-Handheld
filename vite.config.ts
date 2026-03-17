import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

// Generate a build timestamp in Asia/Shanghai timezone
const buildTime = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date()).replace(/\//g, '-');

const fullVersion = `${pkg.version} (Build ${buildTime})`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(fullVersion),
  },
  // IMPORTANT: This sets the base path to relative.
  // This is the most portable setting for GitHub Pages.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});