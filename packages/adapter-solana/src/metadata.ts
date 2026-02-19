import { NetworkSolana } from '@web3icons/react';

import type { EcosystemMetadata } from '@openzeppelin/ui-types';

export const ecosystemMetadata: EcosystemMetadata = {
  id: 'solana',
  name: 'Solana',
  description:
    'Solana is a high-performance blockchain supporting smart contracts. It offers fast transaction times and low fees using a Proof of History consensus mechanism.',
  explorerGuidance: 'program IDs on Solana Explorer',
  iconComponent: NetworkSolana,
  bgColorClass: 'bg-purple-100',
  textColorClass: 'text-purple-900',
  defaultFeatureConfig: { enabled: true, showInUI: true },
};
