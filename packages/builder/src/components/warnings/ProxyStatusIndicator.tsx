import { ArrowRight, Network, RotateCcw } from 'lucide-react';
import React from 'react';

import type { ProxyInfo } from '@openzeppelin/contracts-ui-builder-types';
import { AddressDisplay, Button } from '@openzeppelin/contracts-ui-builder-ui';
import { cn } from '@openzeppelin/contracts-ui-builder-utils';

export interface ProxyStatusIndicatorProps {
  /** Chain-agnostic proxy information */
  proxyInfo: ProxyInfo;
  /** Pre-generated explorer URL for the proxy address (optional) */
  proxyExplorerUrl?: string;
  /** Pre-generated explorer URL for the implementation address (optional) */
  implementationExplorerUrl?: string;
  /** Pre-generated explorer URL for the admin address (optional) */
  adminExplorerUrl?: string;
  /** Callback when user wants to reload without proxy detection */
  onIgnoreProxy?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Component for displaying proxy detection status and providing override controls
 * Shows that the interface definition was fetched from the implementation, not the proxy
 */
export const ProxyStatusIndicator: React.FC<ProxyStatusIndicatorProps> = ({
  proxyInfo,
  proxyExplorerUrl,
  implementationExplorerUrl,
  adminExplorerUrl,
  onIgnoreProxy,
  className,
}) => {
  if (!proxyInfo?.isProxy) {
    return null;
  }

  const hasImplementation = !!proxyInfo.implementationAddress;
  const hasAdmin = !!proxyInfo.adminAddress;

  return (
    <div
      className={cn(
        'space-y-3 p-4 rounded-lg border',
        'bg-blue-50 border-blue-200 text-blue-900',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Network className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <span className="font-semibold">Proxy Pattern Detected</span>
        <span className="font-medium uppercase bg-blue-100 px-2 py-0.5 rounded text-xs text-blue-800">
          {proxyInfo.proxyType}
        </span>
      </div>

      {/* Explanation */}
      {hasImplementation ? (
        <div className="space-y-2 text-sm">
          <p className="text-blue-800">
            <strong>Using implementation&apos;s interface definition</strong> to generate the
            function interface. The proxy forwards calls to the implementation.
          </p>

          <div className="flex items-center gap-2 text-blue-700">
            <span>Proxy:</span>
            <AddressDisplay
              address={proxyInfo.proxyAddress}
              showCopyButton={true}
              explorerUrl={proxyExplorerUrl}
              className="bg-blue-100 text-blue-800"
            />
          </div>

          <div className="flex items-center gap-2 text-blue-700">
            <ArrowRight className="h-3 w-3 text-blue-500" />
            <span>Implementation:</span>
            <AddressDisplay
              address={proxyInfo.implementationAddress!}
              showCopyButton={true}
              explorerUrl={implementationExplorerUrl}
              className="bg-blue-100 text-blue-800"
            />
          </div>

          {hasAdmin && (
            <div className="flex items-center gap-2 text-blue-700">
              <span>Admin:</span>
              <AddressDisplay
                address={proxyInfo.adminAddress!}
                showCopyButton={true}
                explorerUrl={adminExplorerUrl}
                className="bg-blue-100 text-blue-800"
              />
            </div>
          )}

          <p className="text-xs text-blue-700">
            Some management or diagnostic getters may not be callable by all accounts. The
            implementation and controller addresses shown here are derived from on-chain state.
          </p>
        </div>
      ) : (
        <p className="text-sm text-blue-800">
          Implementation interface definition is not available. Showing proxy interface instead.
        </p>
      )}

      {/* Override button */}
      {onIgnoreProxy && hasImplementation && (
        <div className="pt-2 border-t border-blue-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onIgnoreProxy}
            className={cn(
              'text-blue-700 border-blue-300 hover:bg-blue-100',
              'flex items-center gap-1.5'
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Detection (Use Proxy Interface)
          </Button>
          <p className="text-xs text-blue-600 mt-1">
            Click if our proxy detection is incorrect and you want the original proxy interface
            instead.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProxyStatusIndicator;
