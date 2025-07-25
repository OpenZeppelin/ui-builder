import { useCallback } from 'react';

import {
  AdapterProvider,
  WalletStateProvider,
} from '@openzeppelin/contracts-ui-builder-react-core';
import type { NativeConfigLoader } from '@openzeppelin/contracts-ui-builder-types';
import { NetworkErrorNotificationProvider, Toaster } from '@openzeppelin/contracts-ui-builder-ui';

import { NetworkErrorHandler } from './components/Common/NetworkErrorHandler';
import { ContractsUIBuilder } from './components/ContractsUIBuilder';
import { useUIBuilderState } from './components/ContractsUIBuilder/hooks';
import AppSidebar from './components/Sidebar/AppSidebar';
import { StorageOperationsProvider } from './contexts/StorageOperationsContext';
import { getAdapter, getNetworkById } from './core/ecosystemManager';

// Use Vite's import.meta.glob to find all potential kit config files.
// Expecting them to be .ts files as per convention.
const kitConfigImporters = import.meta.glob('./config/wallet/*.config.ts');

// Separate component to access builder state
function AppContent() {
  const {
    state,
    actions: {
      lifecycle: { load, createNew, resetAfterDelete },
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
      <AppSidebar
        onLoadContractUI={handleLoad}
        onCreateNew={() => void createNew()}
        onResetAfterDelete={resetAfterDelete}
        currentLoadedConfigurationId={state.loadedConfigurationId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="py-8 flex-1">
          <ContractsUIBuilder />
        </main>
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
      <StorageOperationsProvider>
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
      </StorageOperationsProvider>
    </NetworkErrorNotificationProvider>
  );
}

export default App;
