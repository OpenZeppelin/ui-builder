/** @type {import('tailwindcss').Config} */
module.exports = {
  // Minimal config for Tailwind v4
  // Theme configuration has moved to packages/styles/global.css using @theme directives

  // Content paths are automatically detected by Tailwind v4.
  // Theme is defined in `packages/styles/global.css` as per Tailwind v4.

  darkMode: ['class'], // Use class strategy for dark mode

  // Plugins are still loaded via JS config in v4
  plugins: [
    require('tailwindcss-animate'), // Plugin for animations
    // Add any other globally shared Tailwind plugins here
  ],
};
