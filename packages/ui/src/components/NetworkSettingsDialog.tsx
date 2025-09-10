import React from 'react';

import { ContractAdapter } from '@openzeppelin/contracts-ui-builder-types';

import { ExplorerSettingsPanel } from './explorer/ExplorerSettingsPanel';
import { RpcSettingsPanel } from './rpc/RpcSettingsPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface NetworkSettingsDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** The network configuration to show settings for */
  networkConfig: {
    id: string;
    name: string;
  } | null;
  /** The adapter to use for settings */
  adapter: ContractAdapter | null;
  /** The default tab to show */
  defaultTab?: 'rpc' | 'explorer';
  /** Callback when settings are changed */
  onSettingsChanged?: () => void;
}

/**
 * Reusable network settings dialog component.
 * Provides tabbed interface for RPC and Explorer settings.
 * Dynamically shows only relevant tabs based on adapter capabilities.
 */
export const NetworkSettingsDialog: React.FC<NetworkSettingsDialogProps> = ({
  isOpen,
  onOpenChange,
  networkConfig,
  adapter,
  defaultTab = 'rpc',
  onSettingsChanged,
}) => {
  const handleSettingsChanged = (): void => {
    onSettingsChanged?.();
    onOpenChange(false);
  };

  // Determine which tabs to show based on adapter capabilities
  const supportsRpcConfig = Boolean(adapter?.validateRpcEndpoint || adapter?.testRpcConnection);

  const supportsExplorerConfig = Boolean(
    adapter?.validateExplorerConfig || adapter?.testExplorerConnection
  );

  // Determine the appropriate default tab
  const effectiveDefaultTab = ((): 'rpc' | 'explorer' => {
    if (defaultTab === 'explorer' && supportsExplorerConfig) return 'explorer';
    if (defaultTab === 'rpc' && supportsRpcConfig) return 'rpc';
    if (supportsRpcConfig) return 'rpc';
    if (supportsExplorerConfig) return 'explorer';
    return 'rpc'; // fallback
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Network Settings</DialogTitle>
          <DialogDescription>Configure settings for {networkConfig?.name}</DialogDescription>
        </DialogHeader>
        {networkConfig && (
          <>
            {adapter ? (
              <>
                {supportsRpcConfig && supportsExplorerConfig ? (
                  // Both tabs available
                  <Tabs defaultValue={effectiveDefaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="rpc">RPC Provider</TabsTrigger>
                      <TabsTrigger value="explorer">Explorer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rpc">
                      <RpcSettingsPanel
                        adapter={adapter}
                        networkId={networkConfig.id}
                        onSettingsChanged={handleSettingsChanged}
                      />
                    </TabsContent>
                    <TabsContent value="explorer">
                      <ExplorerSettingsPanel
                        adapter={adapter}
                        networkId={networkConfig.id}
                        onSettingsChanged={handleSettingsChanged}
                      />
                    </TabsContent>
                  </Tabs>
                ) : supportsRpcConfig ? (
                  // Only RPC tab
                  <div className="w-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">RPC Provider Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure RPC endpoint for this network
                      </p>
                    </div>
                    <RpcSettingsPanel
                      adapter={adapter}
                      networkId={networkConfig.id}
                      onSettingsChanged={handleSettingsChanged}
                    />
                  </div>
                ) : supportsExplorerConfig ? (
                  // Only Explorer tab
                  <div className="w-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">Explorer Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure block explorer for this network
                      </p>
                    </div>
                    <ExplorerSettingsPanel
                      adapter={adapter}
                      networkId={networkConfig.id}
                      onSettingsChanged={handleSettingsChanged}
                    />
                  </div>
                ) : (
                  // No configuration supported
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">No network configuration available</p>
                      <p className="text-xs mt-1">
                        This network uses default settings that cannot be customized
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading network adapter...</p>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
