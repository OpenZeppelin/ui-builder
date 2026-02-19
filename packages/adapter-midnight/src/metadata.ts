import type { EcosystemMetadata } from '@openzeppelin/ui-types';

export const ecosystemMetadata: EcosystemMetadata = {
  id: 'midnight',
  name: 'Midnight',
  description:
    'Midnight is a data protection blockchain that enables programmable privacy. It allows developers to build applications that shield sensitive data, including wallet addresses and transaction information, while leveraging zero-knowledge proofs for selective disclosure of data.',
  explorerGuidance: 'contract IDs on Midnight Explorer',
  addressExample: '0000...0000',
  bgColorClass: 'bg-indigo-100',
  textColorClass: 'text-indigo-900',
  defaultFeatureConfig: { enabled: true, showInUI: true },
};
