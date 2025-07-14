'use client';

import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';

import { JSX, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { logger, userRpcConfigService } from '@openzeppelin/contracts-ui-builder-utils';
import type { ContractAdapter, UserRpcProviderConfig } from '@openzeppelin/contracts-ui-builder-types';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { UrlField } from '../fields/UrlField';

interface RpcSettingsPanelProps {
  adapter: ContractAdapter;
  networkId: string;
  onSettingsChanged?: () => void;
}

interface FormData {
  rpcUrl: string;
}

export function RpcSettingsPanel({
  adapter,
  networkId,
  onSettingsChanged,
}: RpcSettingsPanelProps): JSX.Element {
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
      rpcUrl: '',
    },
  });

  const rpcUrl = watch('rpcUrl');

  // Load existing configuration on mount
  useEffect(() => {
    try {
      const config = userRpcConfigService.getUserRpcConfig(networkId);
      if (config && config.url) {
        setValue('rpcUrl', config.url);
      }
    } catch (error) {
      logger.error('RpcSettingsPanel', 'Error loading RPC configuration:', error);
    }
  }, [networkId, setValue]);

  const testConnection = useCallback(async () => {
    if (!rpcUrl || !adapter.testRpcConnection) {
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const rpcConfig: UserRpcProviderConfig = {
        url: rpcUrl,
        name: 'Custom RPC',
        isCustom: true,
      };

      const result = await adapter.testRpcConnection(rpcConfig);
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
  }, [adapter, rpcUrl]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (data.rpcUrl) {
        // Validate the URL if adapter supports it
        if (adapter.validateRpcEndpoint) {
          const rpcConfig: UserRpcProviderConfig = {
            url: data.rpcUrl,
            name: 'Custom RPC',
            isCustom: true,
          };

          const isValid = await adapter.validateRpcEndpoint(rpcConfig);
          if (!isValid) {
            setConnectionTestResult({
              success: false,
              message: 'Invalid RPC endpoint',
            });
            return;
          }
        }

        // Save the configuration
        userRpcConfigService.saveUserRpcConfig(networkId, {
          url: data.rpcUrl,
          name: 'Custom RPC',
          isCustom: true,
        });
      } else {
        // Clear the configuration
        userRpcConfigService.clearUserRpcConfig(networkId);
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
    setValue('rpcUrl', '');
    userRpcConfigService.clearUserRpcConfig(networkId);
    setConnectionTestResult(null);
    onSettingsChanged?.();
  }, [networkId, setValue, onSettingsChanged]);

  const supportsRpcConfig = Boolean(adapter.validateRpcEndpoint || adapter.testRpcConnection);

  if (!supportsRpcConfig) {
    return (
      <div className="text-sm text-muted-foreground">
        Custom RPC endpoints are not supported for this network.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">RPC Endpoint Configuration</AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <p className="mt-2">
            Setting your own RPC endpoint ensures better reliability, faster response times, and
            higher rate limits. Public endpoints may be rate-limited or experience congestion during
            high traffic periods.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <UrlField<FormData>
          id="rpcUrl"
          name="rpcUrl"
          control={control}
          label="RPC Endpoint URL"
          placeholder="https://eth-mainnet.g.alchemy.com/v2/your-api-key"
          helperText="Enter your complete RPC endpoint URL including any API keys"
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
        <Button type="submit" disabled={!isDirty && !rpcUrl}>
          Save Settings
        </Button>
        {adapter.testRpcConnection && rpcUrl && (
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
