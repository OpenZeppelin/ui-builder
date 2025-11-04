---
'@openzeppelin/ui-builder-app': patch
'@openzeppelin/ui-builder-adapter-evm': patch
---

Fix EVM network loading regression in preview/production builds

- Fix issue where EVM networks failed to load in preview/docker modes while other adapters worked
- Implement adapter-specific Vite configuration pattern for better isolation and fault tolerance
- Add dynamic loading of adapter Vite configs with graceful error handling
- Create vite-config.ts exports for EVM, Solana, and Stellar adapters
- Ensure Midnight adapter's WASM plugins don't interfere with other adapters' dynamic imports
- Add build-time validation to enforce vite-config pattern across all adapters

