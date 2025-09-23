/**
 * Custom ESLint plugin for UI Builder
 */

'use strict';

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// Import our custom rules
const noExtraAdapterMethods = require('./rules/no-extra-adapter-methods.cjs');

// Export the plugin
module.exports = {
  rules: {
    'no-extra-adapter-methods': noExtraAdapterMethods,
  },
};
