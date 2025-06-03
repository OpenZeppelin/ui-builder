import { SiGithub } from '@icons-pack/react-simple-icons';

import { useCallback } from 'react';

import {
  AdapterProvider,
  WalletConnectionHeader,
  WalletStateProvider,
} from '@openzeppelin/transaction-form-react-core';
import type { NativeConfigLoader } from '@openzeppelin/transaction-form-types';

import { TransactionFormBuilder } from './components/FormBuilder/TransactionFormBuilder';
import { getAdapter, getNetworkById } from './core/ecosystemManager';

// Use Vite's import.meta.glob to find all potential kit config files.
// Expecting them to be .ts files as per convention.
const kitConfigImporters = import.meta.glob('./config/wallet/*.config.ts');

function App() {
  const loadAppConfigModule: NativeConfigLoader = useCallback(async (relativePath: string) => {
    // relativePath is now expected to be like './config/wallet/rainbowkit.config.ts'
    const importerToCall = kitConfigImporters[relativePath];

    if (importerToCall) {
      try {
        const module = (await importerToCall()) as { default?: Record<string, unknown> } & Record<
          string,
          unknown
        >;
        return module.default || module;
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }, []);

  return (
    <AdapterProvider resolveAdapter={getAdapter}>
      <WalletStateProvider
        initialNetworkId="ethereum-mainnet"
        getNetworkConfigById={getNetworkById}
        loadConfigModule={loadAppConfigModule}
      >
        <div className="bg-background text-foreground min-h-screen">
          <header className="border-b px-6 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="h-6 w-auto" />
                <div className="h-5 border-l border-gray-300 mx-1"></div>
                <span className="text-base font-medium">Transaction Form Builder</span>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/OpenZeppelin/transaction-form-builder"
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                  rel="noopener noreferrer"
                >
                  <SiGithub size={16} />
                </a>
                <div className="border-l pl-4">
                  <WalletConnectionHeader />
                </div>
              </div>
            </div>
          </header>

          <main className="py-8">
            <TransactionFormBuilder />
          </main>

          <footer className="text-muted-foreground mt-10 border-t py-6 text-center text-sm">
            <div className="container mx-auto">
              <p>© {new Date().getFullYear()} OpenZeppelin Transaction Form Builder</p>
              <p className="mt-1">
                A proof of concept for building transaction forms for blockchain applications
              </p>
            </div>
          </footer>
        </div>
      </WalletStateProvider>
    </AdapterProvider>
  );
}

export default App;
