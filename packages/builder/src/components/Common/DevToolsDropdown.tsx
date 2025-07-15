import { Settings, Wrench } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useNetworkErrors,
} from '@openzeppelin/contracts-ui-builder-ui';

/**
 * Developer tools dropdown component for testing and debugging features.
 */
export const DevToolsDropdown = () => {
  const { reportNetworkError } = useNetworkErrors();

  const triggerRpcError = () => {
    reportNetworkError(
      'rpc',
      'ethereum-mainnet',
      'Ethereum Mainnet',
      'Failed to connect to RPC endpoint: Connection timeout after 5000ms'
    );
  };

  const triggerExplorerError = () => {
    reportNetworkError(
      'explorer',
      'ethereum-mainnet',
      'Ethereum Mainnet',
      'Failed to fetch contract ABI: Invalid API key or rate limit exceeded'
    );
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
        <DropdownMenuLabel>Network Error Testing</DropdownMenuLabel>
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
