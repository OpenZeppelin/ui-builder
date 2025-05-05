export * from './adapter';
export { default } from './adapter'; // Default export for convenience

// Optionally re-export types if needed
// export * from './types'; // No types.ts in Midnight adapter yet

export { MidnightAdapter } from './adapter';
export {
  midnightNetworks,
  midnightMainnetNetworks,
  midnightTestnetNetworks,
  // Individual networks
  midnightMainnet,
  midnightDevnet,
} from './networks';
