/**
 * Midnight Adapter Entry Point
 *
 * Browser Compatibility:
 *
 * This ensures Midnight-specific browser shims are only loaded when the user
 * selects the Midnight ecosystem, keeping other adapters lightweight.
 */

// Initialize browser environment (Buffer + CommonJS polyfills) as soon as adapter is imported
import './browser-init';

export * from './adapter';
export { default } from './adapter'; // Default export for convenience

// Re-export adapter-specific types
export type { MidnightContractArtifacts } from './types';
export { isMidnightContractArtifacts } from './types';

export { MidnightAdapter } from './adapter';
export {
  midnightNetworks,
  midnightTestnetNetworks,
  // Individual networks
  midnightTestnet,
} from './networks';

// Export adapter configuration
export { midnightAdapterConfig } from './config';
