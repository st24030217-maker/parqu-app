import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (!normalized.includes('node_modules')) return undefined;
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (normalized.includes('/node_modules/three/')) {
            return 'vendor-three';
          }
          if (normalized.includes('/node_modules/ogl/') || normalized.includes('@paper-design')) {
            return 'vendor-shaders';
          }
          if (normalized.includes('/node_modules/gsap/')) {
            return 'vendor-gsap';
          }
          if (normalized.includes('/node_modules/motion/') || normalized.includes('/node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          if (normalized.includes('/node_modules/animejs/')) {
            return 'vendor-anime';
          }
          if (normalized.includes('/node_modules/leaflet/')) {
            return 'vendor-leaflet';
          }
          if (normalized.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (normalized.includes('/node_modules/lottie-react/') || normalized.includes('/node_modules/lottie-web/')) {
            return 'vendor-lottie';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
})
