import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
    'common/index': 'src/common/index.ts',
    'contracts/index': 'src/contracts/index.ts',
    'forms/index': 'src/forms/index.ts',
    'networks/index': 'src/networks/index.ts',
    'transactions/index': 'src/transactions/index.ts',
    'config/app-config': 'src/config/app-config.ts',
  },
  external: [], // types package has no external dependencies
});
