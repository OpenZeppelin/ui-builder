import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  external: ['@midnight-ntwrk/dapp-connector-api', '@midnight-ntwrk/wallet-api'],
});
