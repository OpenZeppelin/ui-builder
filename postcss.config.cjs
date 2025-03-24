/**
 * IMPORTANT: This is the source file for all PostCSS configurations in the monorepo.
 * DO NOT edit the symlinked versions in the packages directories.
 * Instead, edit this file and run `pnpm create-symlinks` to update all copies.
 */
module.exports = {
  plugins: {
    'postcss-nesting': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
