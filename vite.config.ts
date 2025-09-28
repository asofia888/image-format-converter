import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - explicitly defined to avoid dependency issues
          'vendor-react': ['react', 'react-dom'],
          'vendor-jszip': ['jszip'],
          'vendor-dompurify': ['dompurify']
        }
      }
    },
    // Optimize chunk size threshold
    chunkSizeWarningLimit: 500,
    // Disable source maps for smaller bundle
    sourcemap: false,
    // Enhanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
        unused: true,
        dead_code: true
      },
      mangle: {
        safari10: true
      }
    },
    // Target modern browsers for smaller output
    target: 'es2020'
  },
  // Enhanced dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['jszip'] // Will be dynamically imported
  }
})
