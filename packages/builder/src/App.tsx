import { useCallback } from 'react';

import {
  AdapterProvider,
  WalletStateProvider,
} from '@openzeppelin/contracts-ui-builder-react-core';
import type { NativeConfigLoader } from '@openzeppelin/contracts-ui-builder-types';
import { NetworkErrorNotificationProvider, Toaster } from '@openzeppelin/contracts-ui-builder-ui';

import { Header } from './components/Common/Header';
import { NetworkErrorHandler } from './components/Common/NetworkErrorHandler';
import { ContractsUIBuilder } from './components/ContractsUIBuilder';
import { useUIBuilderState } from './components/ContractsUIBuilder/hooks';
import AppSidebar from './components/Sidebar/AppSidebar';
import { getAdapter, getNetworkById } from './core/ecosystemManager';

// Use Vite's import.meta.glob to find all potential kit config files.
// Expecting them to be .ts files as per convention.
const kitConfigImporters = import.meta.glob('./config/wallet/*.config.ts');

// Separate component to access builder state
function AppContent() {
  const {
    actions: {
      lifecycle: { load, createNew },
    },
  } = useUIBuilderState();

  const handleLoad = useCallback(
    (id: string) => {
      void load(id);
    },
    [load]
  );

  return (
    <div className="bg-background text-foreground min-h-screen flex">
      {/* Global Sidebar */}
      <AppSidebar onLoadContractUI={handleLoad} onCreateNew={createNew} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="py-8 flex-1">
          <ContractsUIBuilder />
        </main>

        <footer className="text-muted-foreground mt-10 border-t py-6 text-center text-sm">
          <div className="container mx-auto">
            <p>© {new Date().getFullYear()} OpenZeppelin Contracts UI Builder</p>
            <p className="mt-1">
              A proof of concept for building transaction forms for blockchain applications
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

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
          initialNetworkId={null}
          getNetworkConfigById={getNetworkById}
          loadConfigModule={loadAppConfigModule}
        >
          <AppContent />
          {/* Global network error handler - always mounted to handle error toasts */}
          <NetworkErrorHandler />
        </WalletStateProvider>
      </AdapterProvider>
      <Toaster position="top-right" />
    </NetworkErrorNotificationProvider>
  );
}

export default App;
