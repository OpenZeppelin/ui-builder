import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  external: ['@stellar/stellar-sdk', '@stellar/freighter-api'],
});
