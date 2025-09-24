import { Menu } from 'lucide-react';

import { WalletConnectionHeader } from '@openzeppelin/ui-builder-react-core';

interface HeaderProps {
  title?: string;
  /** Open the mobile sidebar */
  onOpenSidebar?: () => void;
}

/**
 * Application header component with optional title, navigation, and wallet connection.
 */
export const Header = ({ title, onOpenSidebar }: HeaderProps) => {
  return (
    <header className="border-b border-[#F5F5F5] bg-background">
      <div className="flex h-16 items-center px-3 sm:px-4 md:px-5 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenSidebar}
          className="mr-2 sm:mr-3 inline-flex items-center justify-center rounded-md p-2 text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary xl:hidden"
        >
          <Menu className="size-5" />
        </button>
        {/* Left side - Title (conditional) */}
        {title && (
          <div className="flex items-center min-w-0">
            <h1 className="truncate max-w-[50vw] text-base font-semibold text-foreground">
              {title}
            </h1>
          </div>
        )}

        {/* Right side - Wallet Connection */}
        <div className="ml-auto flex items-center">
          <WalletConnectionHeader />
        </div>
      </div>
    </header>
  );
};
