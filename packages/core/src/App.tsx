import { TransactionFormBuilder } from './components/FormBuilder/TransactionFormBuilder';
import { AdapterProvider } from './core/hooks';

function App() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="h-6 w-auto" />
            <div className="h-5 border-l border-gray-300 mx-1"></div>
            <span className="text-base font-medium">Transaction Form Builder</span>
          </div>

          <div>
            <a
              href="https://github.com/OpenZeppelin/transaction-form-builder"
              target="_blank"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" height="16" width="16" className="fill-current">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="py-8">
        <AdapterProvider>
          <TransactionFormBuilder />
        </AdapterProvider>
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
  );
}

export default App;
