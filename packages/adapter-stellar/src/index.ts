// Polyfill Buffer for Stellar SDK browser compatibility (only when Stellar adapter is used)
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

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

// Export adapter configuration
export { stellarAdapterConfig } from './config';
