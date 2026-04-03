/*------------TEMPLATE COMMENT START------------*/
/**
 * App Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import { useEffect, useMemo, useState } from 'react';

import { Footer } from '@openzeppelin/ui-components';
import { useDerivedAccountStatus, useWalletState } from '@openzeppelin/ui-react';
import { WalletConnectionWithSettings } from '@openzeppelin/ui-renderer';
import type { ComposerEcosystemRuntime } from '@openzeppelin/ui-types';

// @ts-expect-error - This import will be processed during code generation
import GeneratedForm, { toBuilderAdapter } from './components/GeneratedForm';

/**
 * App Component
 *
 * Main application component that wraps the form.
 * Uses useWalletState to get the active runtime.
 * Caches the first resolved runtime to prevent form remounts during wallet connection.
 */
export function App() {
  const { activeRuntime, isRuntimeLoading } = useWalletState();
  const { isConnected: isWalletConnectedForForm } = useDerivedAccountStatus();

  // Persist the runtime used by the form once it first becomes available to avoid remounts
  // when wallet state briefly transitions.
  const [runtimeForForm, setRuntimeForForm] = useState<ComposerEcosystemRuntime | null>(null);

  useEffect(() => {
    if (activeRuntime) {
      setRuntimeForForm((prev) => prev ?? (activeRuntime as ComposerEcosystemRuntime));
    }
  }, [activeRuntime]);

  const adapterForForm = useMemo(() => toBuilderAdapter(runtimeForForm), [runtimeForForm]);

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
            <div className="app-loading">
              {isRuntimeLoading ? 'Loading runtime...' : 'Loading form...'}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
