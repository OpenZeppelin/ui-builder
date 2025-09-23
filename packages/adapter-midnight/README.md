# Midnight Adapter (`@openzeppelin/ui-builder-adapter-midnight`)

This package provides the `ContractAdapter` implementation for the Midnight Network for the UI Builder.

## Current Status: Wallet Connection Implemented

This adapter has a fully implemented wallet connection feature, allowing users to connect to the Lace (Midnight) browser extension. The core contract interaction methods (`loadContract`, `formatTransactionData`, `signAndBroadcast`, etc.) are currently placeholder stubs and will be implemented in future phases.

### Key Implemented Features

- **Wallet Connection**: Supports connecting to the `mnLace` wallet instance injected into the `window` object.
- **Auto-reconnection**: Automatically reconnects to the user's wallet on page reload if they have not explicitly disconnected.
- **Robust Connection Logic**: Implements a state-polling mechanism to handle the wallet's unconventional API, which resolves before user approval and has internal race conditions.
- **Explicit Disconnect Handling**: Uses `localStorage` to respect user disconnections across sessions, which is the standard workaround for CIP-30 style wallets.
- **Custom UI Components**: Provides custom, theme-consistent `ConnectButton` and `AccountDisplay` components.

## Usage

The `MidnightAdapter` is consumed by the `builder` application's `WalletStateProvider`. It exposes a React context provider (`MidnightWalletProvider`) and a set of facade hooks that are automatically used by the main application UI.

```typescript
// In the builder application's adapter factory:
import {
  MidnightAdapter,
  midnightTestnet,
} from '@openzeppelin/ui-builder-adapter-midnight';

const networkConfig = midnightTestnet;
const midnightAdapter = new MidnightAdapter(networkConfig);
```

## Package Structure

```text
adapter-midnight/
├── src/
│   ├── config/                  # Adapter-specific configuration
│   ├── contract/                # Contract interaction utilities (placeholder)
│   ├── mapping/                 # Type mapping utilities (placeholder)
│   ├── networks/                # Midnight network configurations
│   ├── transaction/             # Transaction execution system (placeholder)
│   ├── validation/              # Validation utilities (placeholder)
│   ├── wallet/                  # Wallet integration (implemented)
│   ├── adapter.ts               # Main MidnightAdapter class implementation
│   └── index.ts                 # Public package exports
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

## Internal Structure

This adapter follows the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md). All wallet-related logic can be found in the `src/wallet/` directory.
