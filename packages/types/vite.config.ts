import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  entry: 'src/index.ts',
  external: [], // types package has no external dependencies
});
