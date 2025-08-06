/*------------TEMPLATE COMMENT START------------*/
/**
 * App Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import {
  useDerivedAccountStatus,
  useWalletState,
  WalletConnectionWithSettings,
} from '@openzeppelin/contracts-ui-builder-react-core';
import { Footer } from '@openzeppelin/contracts-ui-builder-ui';

// @ts-expect-error - This import will be processed during code generation
import GeneratedForm from './components/GeneratedForm';

/**
 * App Component
 *
 * Main application component that wraps the form.
 * Uses useWalletState to get the active adapter.
 */
export function App() {
  const { activeAdapter, isAdapterLoading } = useWalletState();
  const { isConnected: isWalletConnectedForForm } = useDerivedAccountStatus();

  if (isAdapterLoading) {
    return <div className="app-loading">Loading adapter...</div>;
  }
  if (!activeAdapter) {
    return (
      <div className="app-error">
        Adapter not available. Please ensure network is selected and supported.
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header border-b px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="h-6 w-auto" />
            <div className="h-5 border-l border-gray-300 mx-1"></div>
            <div>
              <h1 className="text-base font-medium">@@function-id@@</h1>
              <p className="text-xs text-muted-foreground">
                Form for interacting with blockchain contracts
              </p>
            </div>
          </div>
          <WalletConnectionWithSettings />
        </div>
      </header>

      <main className="main">
        <div className="container">
          <GeneratedForm adapter={activeAdapter} isWalletConnected={isWalletConnectedForForm} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
