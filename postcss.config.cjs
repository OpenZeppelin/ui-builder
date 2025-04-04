/**
 * Root PostCSS Configuration
 * Used by both the `core` build and the `form-renderer` standalone build.
 */

module.exports = {
  plugins: [
    require('postcss-nesting'),
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ].filter(Boolean),
};
