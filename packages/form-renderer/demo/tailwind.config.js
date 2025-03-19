/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(0.57 0.19 275)', // Purple
        secondary: 'oklch(0.65 0.15 245)', // Lavender
        accent: 'oklch(0.65 0.3 25)', // Amber
        destructive: 'oklch(0.65 0.22 25)', // Red
        success: 'oklch(0.65 0.15 150)', // Green
        background: 'oklch(1 0 0)', // White
        foreground: 'oklch(0.18 0 0)', // Near black for text
        muted: 'oklch(0.96 0 0)', // Subtle background
        'muted-foreground': 'oklch(0.45 0 0)', // Secondary text
        border: 'oklch(0.83 0 0)', // Standard borders
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
