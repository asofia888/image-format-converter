import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }

          // Heavy utilities that are dynamically imported
          if (id.includes('node_modules/jszip')) {
            return 'vendor-jszip';
          }

          if (id.includes('node_modules/dompurify')) {
            return 'vendor-dompurify';
          }

          // Core image processing components
          if (
            id.includes('/src/components/ImageConverter.tsx') ||
            id.includes('/src/components/ImageComparator.tsx') ||
            id.includes('/src/components/ConversionControls.tsx') ||
            id.includes('/src/components/CropModal.tsx') ||
            id.includes('/src/hooks/useImageConverter.ts') ||
            id.includes('/src/hooks/useImageConversion.ts')
          ) {
            return 'converter-core';
          }

          // File management components
          if (
            id.includes('/src/components/FileUploader.tsx') ||
            id.includes('/src/hooks/useFileManager.ts') ||
            id.includes('/src/utils/fileValidation.ts')
          ) {
            return 'file-management';
          }

          // Crop functionality
          if (
            id.includes('/src/hooks/useCrop') ||
            id.includes('/src/utils/crop') ||
            id.includes('/src/components/CropControls.tsx')
          ) {
            return 'crop-tools';
          }

          // UI utilities and smaller components
          if (
            id.includes('/src/components/ThemeSwitcher.tsx') ||
            id.includes('/src/components/LanguageSwitcher.tsx') ||
            id.includes('/src/components/Icon.tsx') ||
            id.includes('/src/components/ErrorBoundary.tsx') ||
            id.includes('/src/utils/formatBytes.ts') ||
            id.includes('/src/utils/percentage.ts')
          ) {
            return 'ui-utils';
          }

          // Other vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
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
