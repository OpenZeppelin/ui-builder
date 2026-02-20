import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';
import type { EcosystemExport } from '@openzeppelin/ui-types';

import { EvmAdapter } from './adapter';
import { evmAdapterConfig } from './config';
import { ecosystemMetadata } from './metadata';
import { evmNetworks } from './networks';

export { ecosystemMetadata } from './metadata';
export { EvmAdapter } from './adapter';

export const ecosystemDefinition: EcosystemExport = {
  ...ecosystemMetadata,
  networks: evmNetworks,
  createAdapter: (config) => new EvmAdapter(config as TypedEvmNetworkConfig),
  adapterConfig: evmAdapterConfig,
};

// RainbowKit customization types (re-exported from core via rainbowkit/index.ts)
export type {
  AppInfo,
  RainbowKitConnectButtonProps,
  RainbowKitProviderProps,
  RainbowKitKitConfig,
  RainbowKitCustomizations,
} from './wallet/rainbowkit';
export { isRainbowKitCustomizations, extractRainbowKitCustomizations } from './wallet/rainbowkit';

// Individual network exports (useful for specific references)
export {
  ethereumMainnet,
  arbitrumMainnet,
  polygonMainnet,
  polygonZkEvmMainnet,
  baseMainnet,
  bscMainnet,
  optimismMainnet,
  avalancheMainnet,
  lineaMainnet,
  scrollMainnet,
  zkSyncEraMainnet,
  ethereumSepolia,
  arbitrumSepolia,
  polygonAmoy,
  polygonZkEvmCardona,
  baseSepolia,
  bscTestnet,
  optimismSepolia,
  avalancheFuji,
  lineaSepolia,
  scrollSepolia,
  zksyncSepoliaTestnet,
} from './networks';

// Core types for public API compatibility
export type {
  TypedEvmNetworkConfig,
  WriteContractParameters,
  EvmContractArtifacts,
} from '@openzeppelin/ui-builder-adapter-evm-core';
export {
  isEvmContractArtifacts,
  abiComparisonService,
} from '@openzeppelin/ui-builder-adapter-evm-core';

export type { EvmRelayerTransactionOptions } from '@openzeppelin/ui-builder-adapter-evm-core';
