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
        manualChunks: {
          // Выделяем React и React DOM в отдельный чанк
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Выделяем GSAP в отдельный чанк
          gsap: ['gsap'],
          // Выделяем Lottie в отдельный чанк
          lottie: ['lottie-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Увеличиваем лимит до 1MB для предупреждений
  },
});
