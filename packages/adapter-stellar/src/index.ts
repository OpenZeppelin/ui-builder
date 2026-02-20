import type { EcosystemExport, StellarNetworkConfig } from '@openzeppelin/ui-types';

import { StellarAdapter } from './adapter';
import { stellarAdapterConfig } from './config';
import { ecosystemMetadata } from './metadata';
import { stellarNetworks } from './networks';

export { ecosystemMetadata } from './metadata';
export { StellarAdapter } from './adapter';

export const ecosystemDefinition: EcosystemExport = {
  ...ecosystemMetadata,
  networks: stellarNetworks,
  createAdapter: (config) => new StellarAdapter(config as StellarNetworkConfig),
  adapterConfig: stellarAdapterConfig,
};

// Adapter-specific types
export type { StellarContractArtifacts } from './types/artifacts';
export { isStellarContractArtifacts } from './types/artifacts';

// Individual network exports
export { stellarPublic, stellarTestnet } from './networks';
