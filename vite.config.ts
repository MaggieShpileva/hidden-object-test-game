import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ВАЖНО: React, React-DOM и React-Router должны быть в одном чанке
          // Это критично для корректной работы React 19 в production
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }
          // Выделяем Three.js и связанные библиотеки в отдельный чанк
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'three-vendor';
          }
          // Выделяем Pixi.js в отдельный чанк
          if (id.includes('node_modules/pixi.js') || id.includes('node_modules/@pixi')) {
            return 'pixi-vendor';
          }
          // Выделяем GSAP в отдельный чанк
          if (id.includes('node_modules/gsap')) {
            return 'gsap';
          }
          // Выделяем Lottie в отдельный чанк
          if (id.includes('node_modules/lottie')) {
            return 'lottie';
          }
          // Остальные node_modules в vendor чанк
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
