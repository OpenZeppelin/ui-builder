/**
 * Midnight Adapter Entry Point
 *
 * Browser Compatibility:
 *
 * This ensures Midnight-specific browser shims are only loaded when the user
 * selects the Midnight ecosystem, keeping other adapters lightweight.
 */

// Initialize browser environment (Buffer + CommonJS polyfills) as soon as adapter is imported
import './browser-init';

import type { EcosystemExport, MidnightNetworkConfig } from '@openzeppelin/ui-types';

import { MidnightAdapter } from './adapter';
import { midnightAdapterConfig } from './config';
import { ecosystemMetadata } from './metadata';
import { midnightNetworks } from './networks';

export { ecosystemMetadata } from './metadata';

export const ecosystemDefinition: EcosystemExport = {
  ...ecosystemMetadata,
  networks: midnightNetworks,
  createAdapter: (config) => new MidnightAdapter(config as MidnightNetworkConfig),
  adapterConfig: midnightAdapterConfig,
};

export * from './adapter';
export { default } from './adapter';

// Adapter-specific types
export type { MidnightContractArtifacts } from './types';
export { isMidnightContractArtifacts } from './types';

// Individual network exports
export { midnightTestnet } from './networks';
