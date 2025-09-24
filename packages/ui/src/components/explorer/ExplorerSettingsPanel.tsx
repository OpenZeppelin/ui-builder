'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { JSX, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter, UserExplorerConfig } from '@openzeppelin/ui-builder-types';
import {
  appConfigService,
  logger,
  userExplorerConfigService,
} from '@openzeppelin/ui-builder-utils';

import { SettingsFooter } from '@/components/settings/SettingsFooter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { BooleanField } from '../fields/BooleanField';
import { PasswordField } from '../fields/PasswordField';
import { UrlField } from '../fields/UrlField';

interface ExplorerSettingsPanelProps {
  adapter: ContractAdapter;
  networkId: string;
  onSettingsChanged?: () => void;
}

interface FormData {
  explorerUrl: string;
  apiUrl: string;
  apiKey: string;
  useV2Api: boolean;
  applyToAllNetworks: boolean;
}

export function ExplorerSettingsPanel({
  adapter,
  networkId,
  onSettingsChanged,
}: ExplorerSettingsPanelProps): JSX.Element {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<FormData>({
    defaultValues: {
      explorerUrl: '',
      apiUrl: '',
      apiKey: '',
      useV2Api: true,
      applyToAllNetworks: false,
    },
  });

  const explorerUrl = watch('explorerUrl');
  const apiUrl = watch('apiUrl');
  const apiKey = watch('apiKey');
  const useV2Api = watch('useV2Api');

  // Load existing configuration on mount
  useEffect(() => {
    try {
      const config = userExplorerConfigService.getUserExplorerConfig(networkId);
      const globalV2ApiKey = appConfigService.getGlobalServiceConfig('etherscanv2')?.apiKey as
        | string
        | undefined;
      const appDefaultV2Enabled = Boolean(globalV2ApiKey);
      if (config) {
        setValue('explorerUrl', config.explorerUrl || '');
        setValue('apiUrl', config.apiUrl || '');
        setValue('apiKey', config.apiKey || '');
        const hasUserV2 = typeof config.applyToAllNetworks === 'boolean';
        const v2Enabled = hasUserV2 ? Boolean(config.applyToAllNetworks) : appDefaultV2Enabled;
        setValue('applyToAllNetworks', v2Enabled);
        setValue('useV2Api', v2Enabled);
      }
      if (!config) {
        // No user config: reflect app default globally so all networks show the same prefill
        setValue('applyToAllNetworks', appDefaultV2Enabled);
        setValue('useV2Api', appDefaultV2Enabled);
      }
    } catch (error) {
      logger.error('ExplorerSettingsPanel', 'Error loading explorer configuration:', error);
    }
  }, [networkId, setValue]);

  // Auto-select "Apply to all networks" when V2 API is enabled, clear when disabled
  useEffect(() => {
    if (useV2Api) {
      setValue('applyToAllNetworks', true);
    } else {
      setValue('applyToAllNetworks', false);
    }
  }, [useV2Api, setValue]);

  const testConnection = useCallback(async () => {
    if (!adapter.testExplorerConnection || !apiKey) {
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const explorerConfig: UserExplorerConfig = {
        explorerUrl: explorerUrl || undefined,
        apiUrl: apiUrl || undefined,
        apiKey,
        name: 'Custom Explorer',
        isCustom: true,
      };

      const result = await adapter.testExplorerConnection(explorerConfig);
      setConnectionTestResult({
        success: result.success,
        message: result.error || (result.success ? 'Connection successful' : 'Connection failed'),
        latencyMs: result.latency,
      });
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setIsTestingConnection(false);
    }
  }, [adapter, explorerUrl, apiUrl, apiKey]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate the configuration if adapter supports it
      if (adapter.validateExplorerConfig && data.apiKey) {
        const explorerConfig: UserExplorerConfig = {
          explorerUrl: data.explorerUrl || undefined,
          apiUrl: data.apiUrl || undefined,
          apiKey: data.apiKey,
          name: 'Custom Explorer',
          isCustom: true,
          applyToAllNetworks: data.applyToAllNetworks,
        };

        const isValid = await adapter.validateExplorerConfig(explorerConfig);
        if (!isValid) {
          setConnectionTestResult({
            success: false,
            message: 'Invalid explorer configuration',
          });
          return;
        }
      }

      if (data.apiKey || data.explorerUrl || data.apiUrl) {
        const explorerConfig: UserExplorerConfig = {
          explorerUrl: data.explorerUrl || undefined,
          apiUrl: data.apiUrl || undefined,
          apiKey: data.apiKey || undefined,
          name: 'Custom Explorer',
          isCustom: true,
          applyToAllNetworks: data.applyToAllNetworks,
          appliedNetworkIds: data.applyToAllNetworks ? undefined : [networkId],
        };

        // Save the configuration
        userExplorerConfigService.saveUserExplorerConfig(networkId, explorerConfig);

        // If applying to all networks, save to a special key
        if (data.applyToAllNetworks) {
          userExplorerConfigService.saveUserExplorerConfig('__global__', explorerConfig);
        }
      } else {
        // Clear the configuration if all fields are empty
        userExplorerConfigService.clearUserExplorerConfig(networkId);
        if (data.applyToAllNetworks) {
          userExplorerConfigService.clearUserExplorerConfig('__global__');
        }
      }

      onSettingsChanged?.();
      setConnectionTestResult({
        success: true,
        message: 'Settings saved successfully',
      });
    },
    [adapter, networkId, onSettingsChanged]
  );

  const handleReset = useCallback(() => {
    setValue('explorerUrl', '');
    setValue('apiUrl', '');
    setValue('apiKey', '');
    userExplorerConfigService.clearUserExplorerConfig(networkId);
    setConnectionTestResult(null);
    onSettingsChanged?.();
  }, [networkId, setValue, onSettingsChanged]);

  const supportsExplorerConfig = Boolean(
    adapter.validateExplorerConfig || adapter.testExplorerConnection
  );

  // Note: This fallback should rarely be seen since NetworkSettingsDialog
  // now conditionally renders this component based on adapter capabilities.
  // This serves as a defensive fallback for edge cases.
  if (!supportsExplorerConfig) {
    return (
      <div className="text-sm text-muted-foreground">
        Custom explorer configuration is not supported for this network.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">Block Explorer Configuration</AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <p className="mt-2">
            Public API keys are rate-limited and may be exhausted quickly. Using your own key
            ensures reliable access to explorer services.
          </p>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-sm">Etherscan API Support</AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <p>
            <strong>V2 API (Recommended):</strong> Supports all Etherscan-compatible explorers
            across multiple chains with a single API key.
          </p>
          <p>
            <strong>V1 API (Legacy):</strong> Requires chain-specific API endpoints. Some explorers
            may not be supported.
          </p>
          <p className="mt-1">
            <strong>Note:</strong> Non-Etherscan explorers (Blockscout, Routescan, etc.) are not
            supported.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <PasswordField<FormData>
          id="apiKey"
          name="apiKey"
          control={control}
          label="API Key"
          placeholder="Your explorer API key"
          helperText="Required for fetching contract ABIs and other API operations"
          validation={{}}
          showToggle={true}
        />

        <Accordion type="single" collapsible className="w-full pt-4">
          <AccordionItem value="advanced-settings" className="border rounded-md">
            <AccordionTrigger className="text-sm font-medium px-3 py-2 hover:no-underline">
              Advanced Settings
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-4">
              <div className="space-y-6 pt-2">
                {/* API Configuration Section */}
                <div>
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-foreground">API Configuration</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configure API version and network application settings
                    </p>
                  </div>
                  <div className="space-y-4">
                    <BooleanField<FormData>
                      id="useV2Api"
                      name="useV2Api"
                      control={control}
                      label="Use Etherscan V2 API"
                      helperText="Enable the new V2 API for all Etherscan-compatible networks. V2 provides unified access across all chains."
                    />

                    <div className={`ml-6 ${!useV2Api ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <BooleanField<FormData>
                        id="applyToAllNetworks"
                        name="applyToAllNetworks"
                        control={control}
                        label="Apply to all compatible networks"
                        helperText="Apply these settings to all Etherscan-compatible networks in your project."
                        readOnly={!useV2Api}
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Endpoints Section */}
                <div className="pt-4 border-t">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-foreground">Custom Endpoints</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Override default URLs for explorer and API endpoints
                    </p>
                  </div>
                  <div className="space-y-4">
                    <UrlField<FormData>
                      id="explorerUrl"
                      name="explorerUrl"
                      control={control}
                      label="Explorer URL"
                      placeholder="https://etherscan.io"
                      helperText="Base URL for viewing transactions and addresses. If not provided, defaults from the network will be used."
                      validation={{}}
                    />

                    <UrlField<FormData>
                      id="apiUrl"
                      name="apiUrl"
                      control={control}
                      label="API URL"
                      placeholder="https://api.etherscan.io/api"
                      helperText="API endpoint for fetching contract data. If not provided, defaults from the network will be used."
                      validation={{}}
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {connectionTestResult && (
        <div
          className={`flex items-center gap-2 text-sm ${
            connectionTestResult.success ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {connectionTestResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{connectionTestResult.message}</span>
          {connectionTestResult.latencyMs && (
            <span className="text-muted-foreground">({connectionTestResult.latencyMs}ms)</span>
          )}
        </div>
      )}

      <SettingsFooter
        onPrimary={handleSubmit(onSubmit)}
        onSecondary={handleReset}
        primaryLabel="Save Settings"
        disabled={!isDirty && !explorerUrl && !apiUrl && !apiKey}
        extraActions={
          adapter.testExplorerConnection && apiKey ? (
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          ) : null
        }
        result={
          connectionTestResult
            ? {
                type: connectionTestResult.success ? 'success' : 'error',
                message: connectionTestResult.message,
                extra: connectionTestResult.latencyMs
                  ? `${connectionTestResult.latencyMs}ms`
                  : undefined,
              }
            : null
        }
      />
    </form>
  );
}
