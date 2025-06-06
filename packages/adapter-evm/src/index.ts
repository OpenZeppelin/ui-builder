import EvmAdapter from './adapter';

// Re-export the main adapter class
export { EvmAdapter };

// Export RainbowKit customization types
export * from './wallet/rainbowkit/types';

// Optionally re-export types if they need to be accessible directly
// export * from './types';

export {
  evmNetworks,
  evmMainnetNetworks,
  evmTestnetNetworks,
  // Individual networks
  ethereumMainnet,
  polygonMainnet,
  ethereumSepolia,
  polygonAmoy,
  // ... other individual network exports
} from './networks';

// Export other adapter-specific items if any
