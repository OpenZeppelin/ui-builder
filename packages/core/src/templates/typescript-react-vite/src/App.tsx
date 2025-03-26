import { FormPlaceholder } from './components/FormPlaceholder';

/**
 * App Component
 *
 * Main application component that wraps the form.
 * This demonstrates how the generated form will be used in the exported application.
 */
export function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Transaction Form</h1>
        <p>A form for interacting with blockchain contracts</p>
      </header>

      <main className="main">
        <div className="container">
          <FormPlaceholder />
        </div>
      </main>

      <footer className="footer">
        <p>Generated with OpenZeppelin Transaction Form Builder</p>
        <p>© {new Date().getFullYear()} OpenZeppelin</p>
      </footer>
    </div>
  );
}
