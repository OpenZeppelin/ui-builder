import { SiGithub } from '@icons-pack/react-simple-icons';

import { WalletConnectionHeader } from '@openzeppelin/transaction-form-react-core';

/**
 * Application header component containing the logo, title, GitHub link, and wallet connection.
 */
export const Header = () => {
  return (
    <header className="border-b px-6 py-3 min-h-14">
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
  );
};
