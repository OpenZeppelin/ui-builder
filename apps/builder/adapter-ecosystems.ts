import type { OpenZeppelinAdapterEcosystem } from '@openzeppelin/adapters-vite';

export const supportedAdapterEcosystems = [
  'evm',
  'midnight',
  'polkadot',
  'solana',
  'stellar',
] as const satisfies readonly OpenZeppelinAdapterEcosystem[];
