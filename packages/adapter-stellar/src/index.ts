// Re-export the main adapter class
export { StellarAdapter } from './adapter';

// Optionally re-export types if needed
// export * from './types'; // No types.ts in Stellar adapter yet

export {
  stellarNetworks,
  stellarMainnetNetworks,
  stellarTestnetNetworks,
  // Individual networks
  stellarPublic,
  stellarTestnet,
} from './networks';
