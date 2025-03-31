/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // Use class strategy for dark mode (common with shadcn/ui)
  // Paths are relative from the MONOREPO ROOT
  content: [
    // Scan files within packages/core
    './packages/core/index.html',
    './packages/core/src/**/*.{ts,tsx}',

    // Scan files within packages/form-renderer
    './packages/form-renderer/src/**/*.{ts,tsx}',

    // Scan files within the export template source (if its build uses this config, optional but safer)
    './packages/core/src/export/templates/typescript-react-vite/src/**/*.{ts,tsx}',

    // Add any other packages or specific files that use Tailwind classes
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
