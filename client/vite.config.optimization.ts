// Vite optimization configuration
import { defineConfig } from 'vite';

export const optimizationConfig = {
  build: {
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['wouter'],
          'pdf-vendor': ['jspdf'],
          
          // Feature-based chunks
          'ai-features': [
            './src/engines/insightGenerator.ts',
            './src/engines/mantraCreator.ts',
            './src/workers/aiProcessing.worker.ts'
          ],
          'premium-features': [
            './src/context/PremiumContext.tsx',
            './src/components/PremiumGate.tsx'
          ],
          'theme-features': [
            './src/context/ThemeContext.tsx',
            './src/styles/themes.css'
          ]
        },
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
      }
    },
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Optimize CSS
    cssMinify: true,
    
    // Generate source maps for production debugging
    sourcemap: true,
    
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  
  optimizeDeps: {
    // Pre-bundle dependencies
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter',
      'lucide-react'
    ],
    
    // Exclude heavy dependencies from pre-bundling
    exclude: [
      'jspdf',
      '@replit/vite-plugin-cartographer'
    ]
  },
  
  // Development optimizations
  server: {
    // Enable HMR optimizations
    hmr: {
      overlay: false // Disable error overlay for better performance
    }
  }
};

export default optimizationConfig;