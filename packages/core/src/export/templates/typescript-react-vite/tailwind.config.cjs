/** @type {import('tailwindcss').Config} */
module.exports = {
  // Config for exported standalone applications.

  // Explicit content paths are needed here for the exported app's build process.
  // This array will be dynamically populated by the export system.
  content: [],

  darkMode: ['class'], // Use class strategy for dark mode

  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: '0px' }, // Changed from 0 to 0px for more explicit CSS value
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0px' }, // Changed from 0 to 0px
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      // Potentially include shared theme extensions from the monorepo if they are
      // not automatically picked up from global.css or if this config doesn't inherit them.
      // For now, keeping it minimal, assuming global.css handles most theme aspects.
    },
  },

  plugins: [
    require('tailwindcss-animate'),
    // Add any other Tailwind plugins required by the exported app's components.
  ],
};
