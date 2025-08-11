import { SiGithub, SiX } from '@icons-pack/react-simple-icons';
import { Menu } from 'lucide-react';

import { WalletConnectionHeader } from '@openzeppelin/contracts-ui-builder-react-core';

interface HeaderNavigationToggles {
  /** Show link to OpenZeppelin Forum */
  forum?: boolean;
  /** Show link to OpenZeppelin Docs */
  docs?: boolean;
  /** Show link to Github repo */
  github?: boolean;
  /** Show link to X (Twitter) */
  x?: boolean;
}

interface HeaderProps {
  title?: string;
  /** Per-item navigation visibility toggles */
  showNavigation?: HeaderNavigationToggles;
  /** Open the mobile sidebar */
  onOpenSidebar?: () => void;
}

/**
 * Application header component with optional title, navigation, and wallet connection.
 */
export const Header = ({ title, showNavigation, onOpenSidebar }: HeaderProps) => {
  const showForum = !!showNavigation?.forum;
  const showDocs = !!showNavigation?.docs;
  const showGithub = !!showNavigation?.github;
  const showX = !!showNavigation?.x;
  const anyNavVisible = showForum || showDocs || showGithub || showX;

  return (
    <header className="border-b border-[#F5F5F5] bg-background">
      <div className="flex h-16 items-center px-5">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenSidebar}
          className="mr-3 inline-flex items-center justify-center rounded-md p-2 text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary xl:hidden"
        >
          <Menu className="size-5" />
        </button>
        {/* Left side - Title (conditional) */}
        {title && (
          <div className="flex items-center">
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        )}

        {/* Right side - Navigation and tools */}
        <div className="ml-auto flex items-center space-x-6">
          {/* OpenZeppelin Navigation Links (conditional) */}
          {anyNavVisible && (
            <nav className="flex items-center space-x-5">
              {showForum && (
                <a
                  href="https://forum.openzeppelin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:text-gray-600 transition-colors"
                >
                  Forum
                </a>
              )}
              {showDocs && (
                <a
                  href="https://docs.openzeppelin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:text-gray-600 transition-colors"
                >
                  Docs
                </a>
              )}
              {showGithub && (
                <a
                  href="https://github.com/OpenZeppelin/contracts-ui-builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-gray-600 transition-colors"
                  title="View on GitHub"
                >
                  <SiGithub size={20} />
                </a>
              )}
              {showX && (
                <a
                  href="https://x.com/openzeppelin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-gray-600 transition-colors"
                  title="Follow on X"
                >
                  <SiX size={20} />
                </a>
              )}
            </nav>
          )}

          {/* Wallet Connection */}
          <WalletConnectionHeader />
        </div>
      </div>
    </header>
  );
};
