import { SiGithub, SiX } from '@icons-pack/react-simple-icons';

import { WalletConnectionHeader } from '@openzeppelin/contracts-ui-builder-react-core';

interface HeaderProps {
  title?: string;
  showNavigation?: boolean;
}

/**
 * Application header component with optional title, navigation, and wallet connection.
 */
export const Header = ({ title, showNavigation = false }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center px-5">
        {/* Left side - Title (conditional) */}
        {title && (
          <div className="flex items-center">
            <h1 className="text-sm font-semibold text-foreground">{title}</h1>
          </div>
        )}

        {/* Right side - Navigation and tools */}
        <div className="ml-auto flex items-center space-x-6">
          {/* OpenZeppelin Navigation Links (conditional) */}
          {showNavigation && (
            <nav className="flex items-center space-x-5">
              <a
                href="https://forum.openzeppelin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:text-gray-600 transition-colors"
              >
                Forum
              </a>
              <a
                href="https://docs.openzeppelin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:text-gray-600 transition-colors"
              >
                Docs
              </a>
              <a
                href="https://github.com/OpenZeppelin/contracts-ui-builder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-gray-600 transition-colors"
                title="View on GitHub"
              >
                <SiGithub size={20} />
              </a>
              <a
                href="https://x.com/openzeppelin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-gray-600 transition-colors"
                title="Follow on X"
              >
                <SiX size={20} />
              </a>
            </nav>
          )}

          {/* Wallet Connection */}
          <WalletConnectionHeader />
        </div>
      </div>
    </header>
  );
};
