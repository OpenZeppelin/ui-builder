import { useCallback } from 'react';

import { AdapterProvider, WalletStateProvider } from '@openzeppelin/transaction-form-react-core';
import type { NativeConfigLoader } from '@openzeppelin/transaction-form-types';
import { NetworkErrorNotificationProvider, Toaster } from '@openzeppelin/transaction-form-ui';

import { Header } from './components/Common/Header';
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
    <NetworkErrorNotificationProvider>
      <AdapterProvider resolveAdapter={getAdapter}>
        <WalletStateProvider
          initialNetworkId="ethereum-mainnet"
          getNetworkConfigById={getNetworkById}
          loadConfigModule={loadAppConfigModule}
        >
          <div className="bg-background text-foreground min-h-screen">
            <Header />

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
      <Toaster position="top-right" />
    </NetworkErrorNotificationProvider>
  );
}

export default App;
