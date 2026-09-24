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
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-ai';
          }
          if (id.includes('node_modules/peerjs')) {
            return 'vendor-peer';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (
            id.includes('src/data/srdMonsters') ||
            id.includes('src/data/srdSpells') ||
            id.includes('src/data/defaultMaps')
          ) {
            return 'srd-compendium-data';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    target: 'es2022',
  },
})
