# Midnight Adapter Wallet Module

This directory contains the wallet integration layer for the Midnight adapter, providing all wallet‑related UI, hooks, context, and utilities using the Lace Midnight wallet.

## Architectural Approach: Polling-Based Event Emulation

The Midnight adapter uses a polling-based architecture to emulate wallet events:

- The Lace Midnight wallet (`DAppConnectorWalletAPI`) does not expose native `onAccountChange` events.
- `LaceWalletImplementation` polls `api.state()` to detect account changes and emits custom events to listeners.
- Exponential backoff and visibility-aware polling minimize intrusive popups during wallet unlock.

## Purpose

- UI Environment Provision: `MidnightWalletUiRoot` provides a stable provider root for wallet state.
- Facade Hooks: `midnightFacadeHooks` expose standardized hooks for connection and account status.
- UI Components: Custom‑styled wallet components (`ConnectButton`, `AccountDisplay`).
- Event Emulation: Polling-based change detection with listener-driven polling lifecycle.

## Directory Structure

```text
wallet/
├── components/         # Wallet UI components & root
│   ├── MidnightWalletUiRoot.tsx
│   ├── account/
│   └── connect/
├── context/
├── hooks/
├── implementation/     # Lace wallet implementation
├── utils/
└── connection.ts
```

## Key Components & Concepts

- Adapter UI methods:
  - `getEcosystemReactUiContextProvider()` → `MidnightWalletUiRoot`
  - `getEcosystemReactHooks()` → `midnightFacadeHooks`
  - `getEcosystemWalletComponents()` → custom components
- `midnightWalletImplementationManager`: Singleton controller for wallet implementation instance
- `MidnightWalletUiRoot`: Stable provider that wires the implementation and context
- Facade hooks: `useMidnightAccount`, `useMidnightConnect`, `useMidnightDisconnect`

## Key Characteristics

- Single wallet support (Lace Midnight only)
- Polling-based event emulation (no native event handlers)
- Focus/blur heuristics for dismissal detection (no native `onDismiss` event)
- No network switching component (Midnight wallets do not switch networks dynamically)
- Custom UI components matching the Builder's design system

## Implementation Details

### Event Emulation

- `LaceWalletImplementation.onWalletConnectionChange()` emulates native events.
- Polling starts when listeners subscribe, stops when all listeners unsubscribe.
- Adaptive polling intervals: 2s initial, 5s when connected, up to 15s exponential backoff on errors.
- Pauses polling when document is hidden (tab inactive) to reduce intrusive popups.

### Dismissal Detection

- Wallet popup does not expose `onDismiss` or `onReject` events.
- `MidnightWalletUiRoot` monitors `window.focus` events to infer dismissal.
- When focus returns and no address is set, UI stops "Connecting…" and unsubscribes (stops polling).
- 60s fallback timeout prevents infinite loading in edge cases.

### Multiple Popup Prevention

- `LaceWalletImplementation.connect()` uses `connectInFlight` guard to prevent multiple `enable()` calls.
- React Strict Mode double-effects and rapid button clicks are handled gracefully.
- No immediate `api.state()` reads after `enable()` to avoid re-prompting locked wallets.

## Usage in Application

`MidnightWalletUiRoot` is returned by the adapter and used by the Builder's `WalletStateProvider`. Use `useWalletState()` and facade hooks from `@openzeppelin/ui-builder-react-core` to render the wallet UI components from `getEcosystemWalletComponents()`.
