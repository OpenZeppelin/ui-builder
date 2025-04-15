/** @type {import('tailwindcss').Config} */
module.exports = {
  // This config is used by core's Vite build AND as a preset for form-renderer.

  // Content paths are automatically detected by Tailwind v4.
  // Theme is defined in `packages/styles/global.css` as per Tailwind v4.

  darkMode: ['class'], // Use class strategy for dark mode

  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },

  plugins: [
    require('tailwindcss-animate'), // Plugin for animations
    // Add any other globally shared Tailwind plugins here
  ],
};
