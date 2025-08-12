import { useCallback, useState } from 'react';

import {
  AdapterProvider,
  WalletStateProvider,
} from '@openzeppelin/contracts-ui-builder-react-core';
import type { NativeConfigLoader } from '@openzeppelin/contracts-ui-builder-types';
import {
  Footer,
  NetworkErrorNotificationProvider,
  Toaster,
} from '@openzeppelin/contracts-ui-builder-ui';

import { Header } from './components/Common/Header';
import { NetworkErrorHandler } from './components/Common/NetworkErrorHandler';
import { ContractsUIBuilder } from './components/ContractsUIBuilder';
import { useUIBuilderState } from './components/ContractsUIBuilder/hooks';
import AppSidebar from './components/Sidebar/AppSidebar';
import { StorageOperationsProvider } from './contexts/StorageOperationsContext';
import { getAdapter, getNetworkById } from './core/ecosystemManager';
import { AnalyticsProvider } from './hooks/AnalyticsProvider';

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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        isInNewUIMode={state.isInNewUIMode}
        open={isMobileSidebarOpen}
        onOpenChange={setIsMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Contracts UI Builder" onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="pb-8 flex-1">
          <ContractsUIBuilder />
        </main>

        {/* Footer */}
        <Footer />
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
    <AnalyticsProvider tagId={import.meta.env.VITE_GA_TAG_ID} autoInit={true}>
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
    </AnalyticsProvider>
  );
}

export default App;
