# @openzeppelin/ui-builder-adapter-polkadot

## 1.5.0

### Patch Changes

- [#336](https://github.com/OpenZeppelin/ui-builder/pull/336) [`4641bba`](https://github.com/OpenZeppelin/ui-builder/commit/4641bba5c57fd2e5db7fc8ccfe2afd79f80382e5) Thanks [@LuisUrrutia](https://github.com/LuisUrrutia)! - Bump `@openzeppelin/relayer-sdk` from 1.4.0 to 1.9.0, resolving two high-severity transitive vulnerabilities (bigint-buffer buffer overflow, h3 request smuggling).

## 1.4.2

### Patch Changes

- [#331](https://github.com/OpenZeppelin/ui-builder/pull/331) [`2016925`](https://github.com/OpenZeppelin/ui-builder/commit/2016925667b8c52b1912c45101685c878d90a025) Thanks [@pasevin](https://github.com/pasevin)! - Fix EVM bytes type mapping to use BytesField with proper validation. bytes32 and other fixed-size bytes types now use the 'bytes' field type with exactBytes metadata for proper hex validation.

  This fix is in the internal adapter-evm-core package which is bundled into adapter-evm and adapter-polkadot.

## 1.4.1

### Patch Changes

- [#328](https://github.com/OpenZeppelin/ui-builder/pull/328) [`fe9bc16`](https://github.com/OpenZeppelin/ui-builder/commit/fe9bc16111c1a5a5c519c6dde34bd604dfafdce2) Thanks [@pasevin](https://github.com/pasevin)! - Fix broken dependency on private package adapter-evm-core

  Moves `@openzeppelin/ui-builder-adapter-evm-core` from `dependencies` to `devDependencies`. Since the core package is bundled at build time via tsup's `noExternal` config, it should not appear as a runtime dependency in published packages.

## 1.4.0

### Minor Changes

- [#322](https://github.com/OpenZeppelin/ui-builder/pull/322) [`1b5496e`](https://github.com/OpenZeppelin/ui-builder/commit/1b5496e4d2ed2ba9ae8c7e206d65ee87be9eb3ec) Thanks [@pasevin](https://github.com/pasevin)! - Add `getDefaultServiceConfig` method to all adapters for proactive network service health checks

  This new required method enables the UI to proactively test network service connectivity (RPC, indexers, explorers) when a network is selected, displaying user-friendly error banners before users attempt operations that would fail.

  **New method: `getDefaultServiceConfig(serviceId: string): Record<string, unknown> | null`**

  Returns the default configuration values for a network service, extracted from the network config. This allows health check functionality without requiring user configuration.

  Implementation per adapter:
  - **EVM**: Returns `rpcUrl` for 'rpc' service, `explorerUrl` for 'explorer' service
  - **Stellar**: Returns `sorobanRpcUrl` for 'rpc' service, `indexerUri`/`indexerWsUri` for 'indexer' service
  - **Solana**: Returns `rpcEndpoint` for 'rpc' service
  - **Polkadot**: Returns `rpcUrl` for 'rpc' service, `explorerUrl` for 'explorer' service
  - **Midnight**: Returns `httpUrl`/`wsUrl` (from `indexerUri`/`indexerWsUri`) for 'indexer' service

- [#313](https://github.com/OpenZeppelin/ui-builder/pull/313) [`d53274e`](https://github.com/OpenZeppelin/ui-builder/commit/d53274e5ec3db4c7ab33c3b1316bc1c5890f4f23) Thanks [@pasevin](https://github.com/pasevin)! - feat: Add Polkadot ecosystem adapter with EVM support

  Introduces the Polkadot adapter enabling building UIs for EVM-compatible smart contracts
  deployed on Polkadot ecosystem networks.

  **Supported Networks:**

  Hub Networks (P1 - MVP):
  - Polkadot Hub (Chain ID: 420420419)
  - Kusama Hub (Chain ID: 420420418)
  - Polkadot Hub TestNet (Chain ID: 420420417)

  Parachain Networks (P2):
  - Moonbeam (Chain ID: 1284)
  - Moonriver (Chain ID: 1285)
  - Moonbase Alpha (Chain ID: 1287)

  **Features:**
  - Full EVM contract interaction (load, query, sign & broadcast)
  - Wallet integration via RainbowKit and Wagmi
  - Support for both Blockscout (Hub) and Moonscan (Moonbeam) explorers
  - Extensible architecture for future Substrate/Wasm support

  The adapter leverages shared EVM functionality from `adapter-evm-core` for code reuse.
