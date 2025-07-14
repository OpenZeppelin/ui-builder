/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '../packages/builder/src/**/*.{js,ts,jsx,tsx}',
    '../packages/form-renderer/src/**/*.{js,ts,jsx,tsx}',
    './preview.tsx',
  ],
  theme: {
    extend: {
      // Add any common theme extensions here
    },
  },
  plugins: [],
};
