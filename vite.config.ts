import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { changelogPlugin } from './vite-plugin-changelog'

export default defineConfig({
  plugins: [react(), changelogPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Expose to all network interfaces
    port: 5173,
  },
}) 
