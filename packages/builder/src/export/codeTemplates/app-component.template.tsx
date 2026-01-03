/*------------TEMPLATE COMMENT START------------*/
/**
 * App Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import { useEffect, useState } from 'react';

import { Footer } from '@openzeppelin/ui-components';
import {
  useDerivedAccountStatus,
  useWalletState,
  WalletConnectionWithSettings,
} from '@openzeppelin/ui-react';
import type { ContractAdapter } from '@openzeppelin/ui-types';

// @ts-expect-error - This import will be processed during code generation
import GeneratedForm from './components/GeneratedForm';

/**
 * App Component
 *
 * Main application component that wraps the form.
 * Uses useWalletState to get the active adapter.
 * Caches the adapter once available to prevent form remounts during wallet connection.
 */
export function App() {
  const { activeAdapter } = useWalletState();
  const { isConnected: isWalletConnectedForForm } = useDerivedAccountStatus();

  // Persist the adapter used by the form once it first becomes available to avoid remounts
  // This prevents form resets when the adapter briefly transitions during wallet connection
  const [adapterForForm, setAdapterForForm] = useState<ContractAdapter | null>(null);

  useEffect(() => {
    if (activeAdapter) {
      // Don't replace an existing adapter instance to keep the form mounted
      setAdapterForForm((prev) => prev ?? activeAdapter);
    }
  }, [activeAdapter]);

  return (
    <div className="app">
      <header className="header border-b px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="h-6 w-auto" />
            <div className="h-5 border-l border-gray-300 mx-1"></div>
            <div>
              <h1 className="text-base font-medium">@@function-id-escaped@@</h1>
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
          {adapterForForm ? (
            <GeneratedForm adapter={adapterForForm} isWalletConnected={isWalletConnectedForForm} />
          ) : (
            // Only shown before the first adapter resolves, never shown again
            <div className="app-loading">Loading adapter...</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
