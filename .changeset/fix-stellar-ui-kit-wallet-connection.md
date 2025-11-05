---
'@openzeppelin/ui-builder-adapter-stellar': patch
'@openzeppelin/ui-builder-react-core': patch
---

Fix Stellar UI kit wallet connection and Execute Transaction button issues

- Fix WalletConnectionUI to recompute wallet components on each render, ensuring UI kit changes are reflected immediately when toggling between "Stellar Wallets Kit Custom" and "Stellar Wallets Kit"
- Fix StellarWalletsKitConnectButton to propagate connection state changes to adapter's wallet implementation, ensuring Execute Transaction button enables when wallet is connected
- Wire active StellarWalletsKit instance into wallet implementation for proper kit instance management across connect/disconnect/sign operations
- Ensure connection state flows correctly through context hooks so useDerivedAccountStatus properly detects wallet connection
