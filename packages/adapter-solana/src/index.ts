import type { EcosystemExport, SolanaNetworkConfig } from '@openzeppelin/ui-types';

import { SolanaAdapter } from './adapter';
import { solanaAdapterConfig } from './config';
import { ecosystemMetadata } from './metadata';
import { solanaNetworks } from './networks';

export { ecosystemMetadata } from './metadata';

export const ecosystemDefinition: EcosystemExport = {
  ...ecosystemMetadata,
  networks: solanaNetworks,
  createAdapter: (config) => new SolanaAdapter(config as SolanaNetworkConfig),
  adapterConfig: solanaAdapterConfig,
};

// Adapter-specific types
export type { SolanaContractArtifacts } from './types/artifacts';
export { isSolanaContractArtifacts } from './types/artifacts';

// Individual network exports
export { solanaMainnetBeta, solanaDevnet, solanaTestnet } from './networks';
