import type { NetworkConfig } from '@openzeppelin/transaction-form-types';

interface NetworkDetailProps {
  network: NetworkConfig;
}

export function NetworkDetail({ network }: NetworkDetailProps) {
  // Display ecosystem-specific details using proper type guards or 'in' operator
  // The user reverted to a simpler version in NetworkSelectionPanel, let's reflect that.
  if ('chainId' in network && network.chainId !== undefined) {
    return <div>Chain ID: {String(network.chainId)}</div>;
  } else if ('commitment' in network && network.commitment !== undefined) {
    return <div>Commitment: {String(network.commitment)}</div>;
  }
  // TODO: Add support for other ecosystem related details if necessary,
  // or make this more generic if possible.

  return null;
}
