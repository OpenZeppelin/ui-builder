/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use the root config as a preset to inherit theme structure, plugins, etc.
  presets: [require('../../tailwind.config.cjs')],
  // Configure content scanning for *this package only*.
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // Scan source files in form-renderer
    // DO NOT scan builder or other packages here.
  ],
  // darkMode is inherited from the preset.
  // theme extensions are inherited from the preset.
  // plugins are inherited from the preset.
};
