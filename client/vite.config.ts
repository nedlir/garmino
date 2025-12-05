import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Accept connections from outside container
    port: 5173,
    watch: {
      usePolling: true, // Required for Docker volume hot-reload
    },
    hmr: {
      host: 'localhost', // HMR connects via localhost from browser
    },
  },
})
