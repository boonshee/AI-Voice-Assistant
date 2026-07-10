import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Capacitor 需要相对路径加载 dist 内资源
  base: './',
  build: {
    outDir: 'dist',
  },
})
