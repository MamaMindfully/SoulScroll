export default {
  plugins: {
    'postcss-import': {},           // Enables @import in CSS files for modular CSS
    tailwindcss: {},                // Tailwind CSS utility classes
    'postcss-nesting': {},          // Native CSS nesting support (Stage 1)
    autoprefixer: {},               // Adds vendor prefixes for cross-browser compatibility
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {                    // CSS minification for production builds
        preset: 'default'
      }
    })
  }
}
