// Re-export the main adapter class
export { SolanaAdapter } from './adapter';

// Optionally re-export types if needed
// export * from './types'; // No types.ts in Solana adapter yet

export {
  solanaNetworks,
  solanaMainnetNetworks,
  solanaTestnetNetworks,
  // Individual networks
  solanaMainnetBeta,
  solanaDevnet,
  solanaTestnet,
} from './networks';
