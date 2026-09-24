import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'ai';
          }
          if (id.includes('node_modules/peerjs')) {
            return 'peer';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    target: 'es2022',
  },
})
