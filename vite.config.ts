import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf')) return 'jspdf';
              if (id.includes('jspdf-autotable')) return 'jspdf';
              if (id.includes('react')) return 'react-vendor';
            }
          }
      }
    },
    chunkSizeWarningLimit: 1000 // raises warning threshold to 1MB
  }
})
