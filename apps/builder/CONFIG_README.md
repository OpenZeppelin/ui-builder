# Configuration Files

## Configuration Files

This package consumes centralized configuration from the repository root without using symlinks:

- `tailwind.config.cjs`: JS proxy that `module.exports = require('../../tailwind.config.cjs')`
- `postcss.config.cjs`: JS proxy that `module.exports = require('../../postcss.config.cjs')`
- `components.json`: Regular JSON file pointing to `node_modules/@openzeppelin/ui-styles/global.css` as the Tailwind CSS entry

Edit the root configs to change shared behavior. Per-package `components.json` can be adjusted to point to the correct CSS entry for that package.
