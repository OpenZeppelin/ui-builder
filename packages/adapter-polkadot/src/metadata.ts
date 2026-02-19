import { NetworkPolkadot } from '@web3icons/react';

import type { EcosystemMetadata } from '@openzeppelin/ui-types';

export const ecosystemMetadata: EcosystemMetadata = {
  id: 'polkadot',
  name: 'Polkadot',
  description:
    'Polkadot is a heterogeneous multi-chain protocol enabling cross-chain communication and shared security. It supports EVM-compatible smart contracts through Hub networks and parachains like Moonbeam.',
  explorerGuidance: 'Blockscout or Moonscan verified contracts',
  addressExample: '0x...',
  iconComponent: NetworkPolkadot,
  bgColorClass: 'bg-pink-100',
  textColorClass: 'text-pink-900',
  defaultFeatureConfig: { enabled: true, showInUI: true },
};
