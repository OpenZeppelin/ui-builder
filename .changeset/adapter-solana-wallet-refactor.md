---
'@openzeppelin/contracts-ui-builder-adapter-solana': patch
---

Refactor wallet interface architecture for consistency

- Move `SolanaWalletConnectionStatus` interface to `wallet/types.ts` for better organization
- Update wallet connection functions to use two-parameter callback signature
- Maintain structural compatibility with base `WalletConnectionStatus` interface
- Align wallet directory structure with other adapters for architectural consistency
- Update barrel exports to include new wallet types
