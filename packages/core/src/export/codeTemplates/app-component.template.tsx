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
      <header className="header">
        <h1>Transaction Form for @@function-id@@</h1>
        <p>A form for interacting with blockchain contracts</p>
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
