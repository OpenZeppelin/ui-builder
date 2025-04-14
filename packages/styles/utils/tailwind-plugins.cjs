// Custom animations and utilities for Tailwind CSS 4.0
module.exports = function ({ addUtilities, matchUtilities, theme }) {
  addUtilities({
    '.animate-accordion-down': { animation: 'accordion-down 0.2s ease-out' },
    '.animate-accordion-up': { animation: 'accordion-up 0.2s ease-out' },
    '.animate-in': {
      animationFillMode: 'both',
      animationTimingFunction: 'var(--ease-out)',
    },
    '.animate-out': {
      animationFillMode: 'both',
      animationTimingFunction: 'var(--ease-in)',
    },
  });

  // Add duration utilities
  matchUtilities(
    {
      duration: (value) => ({
        animationDuration: value,
      }),
    },
    { values: theme('animationDuration') }
  );

  // Add delay utilities
  matchUtilities(
    {
      delay: (value) => ({
        animationDelay: value,
      }),
    },
    { values: theme('animationDelay') }
  );

  // Add ease utilities
  matchUtilities(
    {
      ease: (value) => ({
        animationTimingFunction: value,
      }),
    },
    { values: theme('animationTimingFunction') }
  );
};
