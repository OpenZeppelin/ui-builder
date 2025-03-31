/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // Use class strategy for dark mode (common with shadcn/ui)
  content: [
    // Scan files within packages/core
    './packages/core/pages/**/*.{ts,tsx}',
    './packages/core/components/**/*.{ts,tsx}',
    './packages/core/app/**/*.{ts,tsx}',
    './packages/core/src/**/*.{ts,tsx}',

    // Scan files within packages/form-renderer (adjust if path differs)
    './packages/form-renderer/src/**/*.{ts,tsx}',

    // Include index.html if Tailwind classes are used there
    './packages/core/index.html',
  ],
  prefix: '', // No prefix needed usually
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // We primarily use CSS variables defined in global.css for colors,
      // but common extensions like keyframes can go here.
      colors: {
        // Expose CSS variables for use in Tailwind utilities if needed,
        // though direct use of semantic classes (bg-primary, text-destructive) is preferred.
        // Example: 'primary': 'hsl(var(--primary))' - This is often handled by shadcn/ui setup.
        // The `@theme inline` in global.css handles exposing CSS vars to Tailwind v4+,
        // so explicit color definitions here might be redundant unless overriding.
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), // Plugin for animations (common with shadcn/ui)
    // require('@tailwindcss/postcss'), // This is usually included in postcss.config.js, not here
  ],
};
