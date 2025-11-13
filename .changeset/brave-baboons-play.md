---
'@openzeppelin/ui-builder-app': patch
'@openzeppelin/ui-builder-adapter-evm': patch
---

Fix EVM wallet network switching on reconnection and improve UX consistency

**Builder App**
- Fix wallet reconnection network switch: automatically re-queue network switch when user disconnects and reconnects wallet in same session
- Centralize "meaningful content" criteria to ensure consistent behavior across auto-save, navigation, and record filtering
- Improve network selection UX: wallet widget now properly unmounts when navigating back to network list
- Preserve ecosystem tab selection when going back without meaningful content
- Fix NetworkSwitchManager to not notify completion on error conditions
- Extract wallet reconnection logic into dedicated `useWalletReconnectionHandler` hook for better code organization

**EVM Adapter**
- Add RPC configuration listener to automatically invalidate cached Wagmi config when user changes RPC settings
- Preserve wallet connection state across network switches by reusing Wagmi config instance
- Add cleanup() method for proper resource management

Fixes #228

