---
'@openzeppelin/contracts-ui-builder-adapter-evm': patch
---

Refactor wallet interface architecture for consistency

- Move `EvmWalletConnectionStatus` interface to `wallet/types.ts` for better organization
- Add `convertWagmiToEvmStatus` utility function to eliminate code duplication
- Fix chainId type conversion in execution config validation to handle both string and number types
- Update wallet barrel exports to include new types and utilities
- Maintain structural compatibility with base `WalletConnectionStatus` interface
