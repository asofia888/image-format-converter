import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // Utils chunk for utility libraries
          utils: ['jszip', 'dompurify'],
          // UI chunk for UI components
          ui: [
            './src/components/ThemeSwitcher.tsx',
            './src/components/LanguageSwitcher.tsx',
            './src/components/ErrorBoundary.tsx'
          ]
        }
      }
    },
    // Optimize chunk size threshold
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging in production
    sourcemap: false,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Optimize dependency bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'jszip', 'dompurify'],
    exclude: []
  }
})
