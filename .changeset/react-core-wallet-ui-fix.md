---
'@openzeppelin/contracts-ui-builder-react-core': patch
---

Fix wallet UI mounting issue when switching between ecosystems

- Fix React key generation bug in `WalletStateProvider` that prevented Stellar wallet UI from mounting after switching from EVM networks
- Update key generation to use `${ecosystem}-${networkId}` format for proper component unmounting/mounting
- Remove unused `lastFullUiKitConfiguration` property from `ExtendedContractAdapter` interface
- Ensure proper wallet UI reconciliation when switching between different blockchain ecosystems
