/** @type {import('tailwindcss').Config} */
module.exports = {
  // Minimal config for Tailwind v4 in exported applications
  // Content paths are automatically detected by Tailwind v4
  // Theme configuration should be handled in CSS files using @theme directives

  darkMode: ['class'], // Dark mode strategy

  // Plugins are still loaded via JS config in v4
  plugins: [
    require('tailwindcss-animate'), // Animation utilities plugin
  ],
};
