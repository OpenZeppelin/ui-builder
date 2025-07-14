'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';

import { JSX, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { userExplorerConfigService } from '@openzeppelin/contracts-ui-builder-utils';
import type { ContractAdapter, UserExplorerConfig } from '@openzeppelin/transaction-form-types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
    },
  });

  const explorerUrl = watch('explorerUrl');
  const apiUrl = watch('apiUrl');
  const apiKey = watch('apiKey');

  // Load existing configuration on mount
  useEffect(() => {
    try {
      const config = userExplorerConfigService.getUserExplorerConfig(networkId);
      if (config) {
        setValue('explorerUrl', config.explorerUrl || '');
        setValue('apiUrl', config.apiUrl || '');
        setValue('apiKey', config.apiKey || '');
      }
    } catch (error) {
      console.error('Error loading explorer configuration:', error);
    }
  }, [networkId, setValue]);

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
        // Save the configuration
        userExplorerConfigService.saveUserExplorerConfig(networkId, {
          explorerUrl: data.explorerUrl || undefined,
          apiUrl: data.apiUrl || undefined,
          apiKey: data.apiKey || undefined,
          name: 'Custom Explorer',
          isCustom: true,
        });
      } else {
        // Clear the configuration if all fields are empty
        userExplorerConfigService.clearUserExplorerConfig(networkId);
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
        <AlertTitle className="text-sm">Supported Explorer Types</AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <p>
            <strong>Important:</strong> This feature currently only supports Etherscan-compatible
            explorers:
          </p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Etherscan (Ethereum)</li>
            <li>Polygonscan (Polygon)</li>
            <li>And other Etherscan-based explorers</li>
          </ul>
          <p className="mt-1">
            <strong>Not supported:</strong> Blockscout, Routescan, or other non-Etherscan explorers.
            Using these will result in API errors.
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

        <UrlField<FormData>
          id="explorerUrl"
          name="explorerUrl"
          control={control}
          label="Explorer URL (Optional)"
          placeholder="https://etherscan.io"
          helperText="Base URL for viewing transactions and addresses. If not provided, defaults from the network will be used."
          validation={{}}
        />

        <UrlField<FormData>
          id="apiUrl"
          name="apiUrl"
          control={control}
          label="API URL (Optional)"
          placeholder="https://api.etherscan.io/api"
          helperText="API endpoint for fetching contract data. If not provided, defaults from the network will be used."
          validation={{}}
        />
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

      <div className="flex gap-2">
        <Button type="submit" disabled={!isDirty && !explorerUrl && !apiUrl && !apiKey}>
          Save Settings
        </Button>
        {adapter.testExplorerConnection && apiKey && (
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
        )}
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
    </form>
  );
}
