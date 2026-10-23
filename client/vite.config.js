import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // The app server is a long way from its users (~260ms RTT), so every extra
    // file costs a full round trip. Left to itself Rolldown emits one ~150-byte
    // chunk per lucide icon (44 of them), which is far more expensive to fetch
    // than to download. Group shared vendor code into a handful of chunks and
    // let per-page chunks carry only page code.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react-router')) return 'router'
          if (id.includes('axios')) return 'axios'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react'
          return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 900
  }
})
