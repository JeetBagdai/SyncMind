import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-pdf'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('react-pdf') || id.includes('pdfjs')) return 'pdf'
          if (id.includes('framer-motion')) return 'motion'
        },
      },
    },
  },
})
