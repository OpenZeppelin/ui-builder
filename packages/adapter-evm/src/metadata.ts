import { NetworkEthereum } from '@web3icons/react';

import type { EcosystemMetadata } from '@openzeppelin/ui-types';

export const ecosystemMetadata: EcosystemMetadata = {
  id: 'evm',
  name: 'Ethereum (EVM)',
  description:
    'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It supports the Ethereum Virtual Machine (EVM) and uses the native cryptocurrency Ether (ETH).',
  explorerGuidance: 'Etherscan verified contracts',
  addressExample: '0x...',
  iconComponent: NetworkEthereum,
  bgColorClass: 'bg-blue-100',
  textColorClass: 'text-blue-900',
  defaultFeatureConfig: { enabled: true, showInUI: true },
};
