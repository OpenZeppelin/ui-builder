// import peerDepsExternal from 'rollup-plugin-peer-deps-external'; // Removed
import { createLibraryConfig } from '../../vite.shared.config';

// To externalize peerDependencies

export default createLibraryConfig({
  packageDir: __dirname,
  external: [
    '@tanstack/react-query', // This is a peerDependency
  ],
});
