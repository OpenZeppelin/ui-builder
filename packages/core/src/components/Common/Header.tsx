import { SiGithub } from '@icons-pack/react-simple-icons';

import { WalletConnectionHeader } from '@openzeppelin/transaction-form-react-core';
import { appConfigService } from '@openzeppelin/transaction-form-utils';

import { DevToolsDropdown } from './DevToolsDropdown';

/**
 * Application header component containing the logo, title, GitHub link, and wallet connection.
 */
export const Header = () => {
  // Check if dev tools should be shown
  const showDevTools = appConfigService.isFeatureEnabled('show_dev_tools');

  return (
    <header className="border-b px-6 py-3 min-h-14">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="h-6 w-auto" />
          <div className="h-5 border-l border-gray-300 mx-1"></div>
          <span className="text-base font-medium">Transaction Form Builder</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Dev Tools Dropdown */}
          {showDevTools && <DevToolsDropdown />}

          {/* GitHub Link */}
          <a
            href="https://github.com/OpenZeppelin/transaction-form-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="View on GitHub"
          >
            <SiGithub size={20} />
          </a>

          {/* Wallet Connection */}
          <WalletConnectionHeader />
        </div>
      </div>
    </header>
  );
};
