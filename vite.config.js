import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/kimi-api': {
        target: 'https://api.moonshot.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kimi-api/, '/v1')
      }
    }
  }
})
