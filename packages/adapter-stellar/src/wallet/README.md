# Stellar Adapter Wallet Module

This directory contains the wallet integration layer for the Stellar adapter, providing all wallet‑related UI, hooks, context, and utilities using `@creit.tech/stellar-wallets-kit`.

## Architectural Approach: Dual UI Support

The Stellar adapter supports two UI modes:

1. Native UI Mode (`stellar-wallets-kit`): Uses the Stellar Wallets Kit’s native button and modal with address display and account management.
2. Custom UI Mode (`custom`): Uses custom React components that match the Builder’s design system.

## Purpose

- UI Environment Provision: `StellarWalletUiRoot` provides a stable provider root for wallet state.
- Facade Hooks: `stellarFacadeHooks` expose standardized hooks for connection and account status.
- UI Components: Custom‑styled wallet components (`ConnectButton`, `AccountDisplay`).
- Configuration: Layered config via `AppConfigService` and programmatic overrides.

## Directory Structure

```text
wallet/
├── components/         # Wallet UI components & root
│   ├── StellarWalletUiRoot.tsx
│   ├── account/
│   ├── connect/
│   └── network/        # (Not used: no network switching in Stellar)
├── context/
├── hooks/
├── implementation/     # Stellar Wallets Kit implementation
├── services/           # Wallet UI config resolution
├── stellar-wallets-kit/
├── utils/
└── connection.ts
```

## Key Components & Concepts

- Adapter UI methods:
  - `getEcosystemReactUiContextProvider()` → `StellarWalletUiRoot`
  - `getEcosystemReactHooks()` → `stellarFacadeHooks`
  - `getEcosystemWalletComponents()` → components for active kit
- `stellarUiKitManager`: Singleton controller for kit state and network config
- `StellarWalletUiRoot`: Stable provider that wires the kit and context
- Facade hooks: `useStellarAccount`, `useStellarConnect`, `useStellarDisconnect`, `useUiKitConfig`

## Differences from EVM Wallet Module

- No network switching component (Stellar wallets do not switch networks dynamically)
- Single primary wallet kit (Stellar Wallets Kit) vs multiple kits on EVM
- No native TypeScript config files are loaded for kit setup (can be added later)

## Configuration

1. Global App Config (`app.config.json`):

   Ecosystem‑namespaced configuration under `globalServiceConfigs.walletui.stellar`.

   Custom UI components:

   ```json
   {
     "globalServiceConfigs": {
       "walletui": {
         "stellar": {
           "kitName": "custom",
           "kitConfig": {
             "showInjectedConnector": false,
             "components": { "exclude": ["NetworkSwitcher"] }
           }
         }
       }
     }
   }
   ```

   Native kit button:

   ```json
   {
     "globalServiceConfigs": {
       "walletui": {
         "stellar": { "kitName": "stellar-wallets-kit", "kitConfig": {} }
       }
     }
   }
   ```

2. Programmatic overrides: pass to `adapter.configureUiKit(overrides)`

## Usage in Application

`StellarWalletUiRoot` is returned by the adapter and used by the Builder’s `WalletStateProvider`. Use `useWalletState()` and facade hooks from `@openzeppelin/ui-react` to render the wallet UI components from `getEcosystemWalletComponents()`.
