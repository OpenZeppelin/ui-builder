import { SiGithub, SiX } from '@icons-pack/react-simple-icons';

import { WalletConnectionHeader } from '@openzeppelin/contracts-ui-builder-react-core';
import { appConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import { DevToolsDropdown } from './DevToolsDropdown';

/**
 * Application header component matching the OpenZeppelin Wizard design with proper branding.
 */
export const Header = () => {
  // Check if dev tools should be shown
  const showDevTools = appConfigService.isFeatureEnabled('show_dev_tools');

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center px-5">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-3">
          <img src="/OZ-Logo-BlackBG.svg" alt="OpenZeppelin Logo" className="w-[160px] h-auto" />
        </div>

        {/* Right side - Navigation and tools */}
        <div className="ml-auto flex items-center space-x-6">
          {/* OpenZeppelin Navigation Links */}
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

          {/* Dev Tools and Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Dev Tools Dropdown */}
            {showDevTools && <DevToolsDropdown />}

            {/* Wallet Connection */}
            <WalletConnectionHeader />
          </div>
        </div>
      </div>
    </header>
  );
};
