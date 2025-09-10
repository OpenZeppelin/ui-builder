---
'@openzeppelin/contracts-ui-builder-adapter-stellar': patch
---

Fix Freighter wallet popup loop and refactor wallet interface architecture

- **Fix critical bug**: Replace aggressive polling with event-driven wallet connection approach in `StellarWalletUiRoot`
- **Eliminate infinite Freighter popups** that occurred when clicking wallet connection button
- Add `stellarWalletImplementationManager` singleton pattern following EVM adapter architecture
- Update adapter to use new implementation manager and return `StellarWalletConnectionStatus`
- Move wallet interfaces (`StellarWalletConnectionStatus`, `StellarConnectionStatusListener`) to `wallet/types.ts`
- Implement event subscriptions with minimal fallback polling (5-minute intervals instead of 1-second)
- Align wallet directory structure with EVM adapter for architectural consistency
