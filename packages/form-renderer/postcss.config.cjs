/**
 * PostCSS Configuration for `form-renderer` standalone build.
 * It references the plugins defined in the root config.
 */
module.exports = {
  // Inherit plugins from the root configuration
  plugins: require('../../postcss.config.cjs').plugins,
};
