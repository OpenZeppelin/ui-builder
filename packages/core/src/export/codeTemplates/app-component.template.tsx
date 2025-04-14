/*------------TEMPLATE COMMENT START------------*/
/**
 * App Component Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This import will be processed during code generation
import GeneratedForm from './components/GeneratedForm';

// Define types for the transaction data
interface TransactionData {
  [key: string]: unknown;
}

/**
 * App Component
 *
 * Main application component that wraps the form.
 */
export function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Transaction Form for @@function-id@@</h1>
        <p>A form for interacting with blockchain contracts</p>
      </header>

      <main className="main">
        <div className="container">
          <GeneratedForm
            onSubmit={(txData: TransactionData) => {
              console.log('Transaction submitted:', txData);
              return Promise.resolve({ txHash: 'demo-tx-hash-' + Date.now() });
            }}
            onError={(error: Error) => {
              console.error('Transaction error:', error);
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
