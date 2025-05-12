/*------------TEMPLATE COMMENT START------------*/
/**
 * App Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This import will be processed during code generation
import { AdapterPlaceholder } from '@@adapter-package-name@@';

// @ts-expect-error - This import will be processed during code generation
import GeneratedForm from './components/GeneratedForm';

interface AppProps {
  adapter: AdapterPlaceholder;
}

/**
 * App Component
 *
 * Main application component that wraps the form.
 */
export function App({ adapter }: AppProps) {
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
        </div>
      </header>

      <main className="main">
        <div className="container">
          <GeneratedForm
            adapter={adapter}
            onSubmit={(data: FormData) => {
              console.log('Transaction submitted:', data);
              // Don't return a Promise, this function should be void
            }}
          />
        </div>
      </main>

      <footer className="footer">
        <p>Generated with OpenZeppelin Transaction Form Builder</p>
        <p>© @@current-year@@ OpenZeppelin</p>
      </footer>
    </div>
  );
}
