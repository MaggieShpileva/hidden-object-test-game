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
          // Выделяем React и React DOM в отдельный чанк
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // Выделяем Three.js и связанные библиотеки в отдельный чанк
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          // Выделяем Pixi.js в отдельный чанк
          if (id.includes('pixi.js') || id.includes('@pixi')) {
            return 'pixi-vendor';
          }
          // Выделяем GSAP в отдельный чанк
          if (id.includes('gsap')) {
            return 'gsap';
          }
          // Выделяем Lottie в отдельный чанк
          if (id.includes('lottie')) {
            return 'lottie';
          }
          // Выделяем node_modules в vendor чанк
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Увеличиваем лимит до 1MB для предупреждений
  },
});
