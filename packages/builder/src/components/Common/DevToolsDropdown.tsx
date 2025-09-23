import { Settings, Wrench } from 'lucide-react';

import { useWalletState } from '@openzeppelin/ui-builder-react-core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useNetworkErrors,
} from '@openzeppelin/ui-builder-ui';

/**
 * Developer tools dropdown component for testing and debugging features.
 */
export const DevToolsDropdown = () => {
  const { reportNetworkError } = useNetworkErrors();
  const { activeNetworkConfig } = useWalletState();

  const triggerRpcError = () => {
    if (activeNetworkConfig) {
      reportNetworkError(
        'rpc',
        activeNetworkConfig.id,
        activeNetworkConfig.name,
        'Failed to connect to RPC endpoint: Connection timeout after 5000ms'
      );
    } else {
      // Fallback if no network is selected
      reportNetworkError(
        'rpc',
        'ethereum-mainnet',
        'Ethereum Mainnet',
        'Failed to connect to RPC endpoint: Connection timeout after 5000ms'
      );
    }
  };

  const triggerExplorerError = () => {
    if (activeNetworkConfig) {
      reportNetworkError(
        'explorer',
        activeNetworkConfig.id,
        activeNetworkConfig.name,
        'Failed to fetch contract ABI: Invalid API key or rate limit exceeded'
      );
    } else {
      // Fallback if no network is selected
      reportNetworkError(
        'explorer',
        'ethereum-mainnet',
        'Ethereum Mainnet',
        'Failed to fetch contract ABI: Invalid API key or rate limit exceeded'
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          title="Developer Tools"
        >
          <Wrench size={16} />
          Dev Tools
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-destructive">
          Not for production! <br /> Disable <code>show_dev_tools</code> feature flag before
          deploying!
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          Network Error Testing
          {activeNetworkConfig && (
            <span className="block text-xs font-normal text-muted-foreground mt-1">
              Current: {activeNetworkConfig.name}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={triggerRpcError}>
          <Settings className="mr-2 h-4 w-4" />
          Trigger RPC Error
        </DropdownMenuItem>
        <DropdownMenuItem onClick={triggerExplorerError}>
          <Settings className="mr-2 h-4 w-4" />
          Trigger Explorer Error
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
