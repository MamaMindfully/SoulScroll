// Replit-specific Vite configuration override
// CRITICAL: This file provides the base: './' setting required for Replit deployment
// To use: npx vite build --config vite.config.replit.js

export default {
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  // Ensure proper module resolution for Replit
  resolve: {
    alias: {
      '@': './client/src',
      '@shared': './shared'
    }
  }
};