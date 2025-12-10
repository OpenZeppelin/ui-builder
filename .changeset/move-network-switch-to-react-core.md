---
'@openzeppelin/ui-builder-react-core': minor
---

Add `NetworkSwitchManager` component and `useWalletReconnectionHandler` hook to react-core for reuse across applications.

- **NetworkSwitchManager**: Headless component that handles automatic wallet network switching for EVM chains. Moved from builder package.
- **useWalletReconnectionHandler**: Hook that detects wallet reconnection and triggers network switch re-queue via callback. Refactored from builder to use a callback-based API for portability.

These additions enable other applications (like Role Manager) to share the same wallet network switching logic without duplicating code.
