import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['base64-js']
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'base64-js': 'base64-js/index.js'
    }
  }
})
