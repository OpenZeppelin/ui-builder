import { createLibraryConfig } from '../../vite.shared.config';

export default createLibraryConfig({
  packageDir: __dirname,
  external: [
    '@radix-ui/react-accordion',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-label',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-select',
    '@radix-ui/react-slot',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-tooltip',
    '@web3icons/react',
    'class-variance-authority',
    'clsx',
    'lodash',
    'lucide-react',
    'tailwind-merge',
    'tailwindcss-animate',
  ],
});
