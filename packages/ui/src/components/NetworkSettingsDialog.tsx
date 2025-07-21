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
              <Tabs defaultValue={defaultTab} className="w-full">
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
