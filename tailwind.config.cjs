const path = require('path'); // Ensure path is required

/** @type {import('tailwindcss').Config} */
module.exports = {
  // This config is used by core's Vite build AND as a preset for form-renderer.

  // Content paths for the `core` build process (relative to root).
  content: [
    path.resolve(__dirname, './packages/core/index.html'),
    path.resolve(__dirname, './packages/core/src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './packages/form-renderer/src/**/*.{js,ts,jsx,tsx}'),
  ],

  // Safelist (keep in case form-renderer needs it via preset)
  safelist: [
    {
      pattern: /data-\[state=(\w+)\]:/, // e.g., data-[state=checked]:bg-primary
    },
    {
      pattern: /data-\[disabled\]/, // e.g., data-[disabled]:opacity-50
    },
    {
      pattern: /data-\[invalid\]/, // Potentially needed
    },
    {
      pattern: /aria-invalid:/, // Matches aria-invalid: styles
    },
  ],

  darkMode: ['class'], // Use class strategy for dark mode
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Colors are defined via CSS variables in `packages/styles/global.css`
      // and exposed via Tailwind's `@theme` directive there.
      // We only define the structure/references here if needed, but prefer
      // relying on the `@theme` directive in global.css for v4+.
      colors: {
        // Example structure if NOT fully relying on @theme inline in global.css:
        // border: 'hsl(var(--border))',
        // input: 'hsl(var(--input))',
        // ring: 'hsl(var(--ring))',
        // background: 'hsl(var(--background))',
        // foreground: 'hsl(var(--foreground))',
        // primary: {
        //   DEFAULT: 'hsl(var(--primary))',
        //   foreground: 'hsl(var(--primary-foreground))',
        // }, // ... and so on for secondary, destructive, muted, accent, card, popover
      },
      borderRadius: {
        lg: 'var(--radius)', // Use CSS variable from global.css
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Potentially add other shared animations: fade-in, slide-up, etc.
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Add other shared animation utilities
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), // Plugin for animations
    // Add any other globally shared Tailwind plugins here
  ],
};
