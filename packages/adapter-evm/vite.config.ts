import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  external: [
    'ethers',
    'viem',
    '@rainbow-me/rainbowkit',
    '@wagmi/core',
    '@wagmi/connectors',
    '@tanstack/react-query',
    'wagmi',
    '@walletconnect/ethereum-provider',
    '@walletconnect/modal',
    '@web3modal/wagmi',
  ],
});
