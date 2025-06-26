import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  external: [
    '@solana/web3.js',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-wallets',
  ],
});
