/**
 * Custom ESLint plugin for UI Builder
 */

'use strict';

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// Import our custom rules from the root directory to maintain a single source of truth
const noExtraAdapterMethods = require('../../.eslint/rules/no-extra-adapter-methods.cjs');

// Export the plugin
module.exports = {
  rules: {
    'no-extra-adapter-methods': noExtraAdapterMethods,
  },
};
