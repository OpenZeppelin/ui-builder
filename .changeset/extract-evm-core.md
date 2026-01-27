---
"@openzeppelin/ui-builder-adapter-evm": patch
---

Refactor: Extract reusable EVM core modules into internal adapter-evm-core package

This internal refactoring extracts stateless, reusable EVM functionality into a new
internal package (`adapter-evm-core`) to enable creating EVM-compatible adapters
for other chains (L2s, Polkadot parachains) without code duplication.

**No breaking changes** - The public API of adapter-evm remains identical.

Extracted modules:
- ABI loading, transformation, and comparison
- Type mapping and form field generation  
- Input parsing and output formatting
- View function querying
- Transaction formatting and execution strategies (EOA, Relayer)
- RPC and Explorer configuration resolution
- Address validation utilities
- Wallet infrastructure (WagmiWalletImplementation, UI kit management)
- RainbowKit configuration utilities

The core package is bundled into adapter-evm at build time (not published separately).
