/** @type {import('tailwindcss').Config} */
module.exports = {
  // This config is used by core's Vite build AND as a preset for form-renderer.

  // Content paths are automatically detected by Tailwind v4.
  // Theme is defined in `packages/styles/global.css` as per Tailwind v4.

  darkMode: ['class'], // Use class strategy for dark mode

  plugins: [
    require('tailwindcss-animate'), // Plugin for animations
    // Add any other globally shared Tailwind plugins here
  ],
};
