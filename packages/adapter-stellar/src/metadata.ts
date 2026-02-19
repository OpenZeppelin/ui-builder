import { NetworkStellar } from '@web3icons/react';

import type { EcosystemMetadata } from '@openzeppelin/ui-types';

export const ecosystemMetadata: EcosystemMetadata = {
  id: 'stellar',
  name: 'Stellar',
  description:
    'Stellar is a fast, energy-efficient blockchain network designed for real-world financial applications. It enables near-instant global payments at low cost, connects digital assets to traditional finance, and supports smart contracts through Soroban.',
  explorerGuidance: 'contract IDs on Stellar Expert',
  addressExample: 'GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG',
  iconComponent: NetworkStellar,
  bgColorClass: 'bg-sky-100',
  textColorClass: 'text-sky-900',
  defaultFeatureConfig: { enabled: true, showInUI: true },
};
