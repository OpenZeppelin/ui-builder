import { SiGithub } from '@icons-pack/react-simple-icons';

import {
  AdapterProvider,
  WalletConnectionHeader,
  WalletStateProvider,
} from '@openzeppelin/transaction-form-react-core';

import { TransactionFormBuilder } from './components/FormBuilder/TransactionFormBuilder';
import { getAdapter, getNetworkById } from './core/ecosystemManager';

function App() {
  /**
   * Generic configuration module loader.
   * This function can load any configuration module by relative path
   * without needing to know what specific UI kit or purpose it serves.
   * The adapter is responsible for specifying the exact path it needs.
   */
  const loadConfigModule = async (
    relativePath: string
  ): Promise<Record<string, unknown> | null> => {
    try {
      const configModule = await import(/* @vite-ignore */ relativePath);
      const config = configModule.default;

      if (config && typeof config === 'object' && !Array.isArray(config)) {
        return config as Record<string, unknown>;
      }
      return null;
    } catch {
      // Expected if the config file doesn't exist
      return null;
    }
  };

  return (
    <AdapterProvider resolveAdapter={getAdapter}>
      <WalletStateProvider
        initialNetworkId="ethereum-mainnet"
        getNetworkConfigById={getNetworkById}
        loadConfigModule={loadConfigModule}
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
