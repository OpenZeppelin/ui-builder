// Barrel file for query module
// Re-export core query functionality
export { isEvmViewFunction } from '@openzeppelin/ui-builder-adapter-evm-core';

// Export adapter-specific wrapper that handles RPC resolution and wallet integration
export { queryEvmViewFunction } from './adapter-query';
