'use client';

import { Info } from 'lucide-react';
import { JSX, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { ContractAdapter, UserExplorerConfig } from '@openzeppelin/ui-builder-types';
import {
  appConfigService,
  logger,
  userExplorerConfigService,
} from '@openzeppelin/ui-builder-utils';

import { SettingsFooter } from '@/components/settings/SettingsFooter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { BooleanField } from '../fields/BooleanField';
import { SelectField } from '../fields/SelectField';

interface ContractDefinitionSettingsPanelProps {
  adapter: ContractAdapter;
  networkId: string;
  onSettingsChanged?: () => void;
}

interface FormData {
  defaultProvider: string;
  applyToAllNetworks: boolean;
}

type ProviderOption = { key: string; label: string };

export function ContractDefinitionSettingsPanel({
  adapter,
  networkId,
  onSettingsChanged,
}: ContractDefinitionSettingsPanelProps): JSX.Element {
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: { defaultProvider: '', applyToAllNetworks: false },
  });

  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load provider options from adapter with optional app-config relabel/filter
  useEffect(() => {
    (async (): Promise<void> => {
      let adapterOptions: ProviderOption[] = [];
      try {
        const method = adapter.getSupportedContractDefinitionProviders;
        const list = typeof method === 'function' ? method() : undefined;
        if (Array.isArray(list)) {
          adapterOptions = list
            .map((item) => ({ key: String(item.key), label: item.label ?? String(item.key) }))
            .filter((o) => o.key);
        }
      } catch (e) {
        logger.debug('ContractDefinitionSettingsPanel', 'Adapter providers probe failed:', e);
      }

      let appConfigOptions: ProviderOption[] = [];
      try {
        const raw = appConfigService.getGlobalServiceParam('contractdefinition', 'providers');
        appConfigOptions = Array.isArray(raw)
          ? raw
              .map((item): ProviderOption | null => {
                if (typeof item === 'string') return { key: item, label: item };
                if (item && typeof item === 'object') {
                  const rec = item as Record<string, unknown>;
                  const keyVal = rec.key;
                  const labelVal = rec.label;
                  if (typeof keyVal === 'string' && keyVal.length > 0) {
                    return {
                      key: keyVal,
                      label: typeof labelVal === 'string' ? labelVal : keyVal,
                    };
                  }
                }
                return null;
              })
              .filter((o): o is ProviderOption => o !== null)
          : [];
      } catch {
        appConfigOptions = [];
      }

      const appKeys = new Set(appConfigOptions.map((o) => o.key));
      const merged: ProviderOption[] =
        appConfigOptions.length > 0
          ? [...appConfigOptions, ...adapterOptions.filter((o) => !appKeys.has(o.key))]
          : adapterOptions;

      setProviderOptions(merged);
    })().catch(() => {
      // ignore
    });
  }, [adapter]);

  // Load saved selection (after options are available to avoid placeholder state)
  useEffect(() => {
    try {
      const config = userExplorerConfigService.getUserExplorerConfig(networkId);
      const saved = config?.defaultProvider;
      if (typeof saved === 'string' && saved.length > 0) {
        setValue('defaultProvider', saved);
      }
      if (typeof config?.applyToAllNetworks === 'boolean') {
        setValue('applyToAllNetworks', config.applyToAllNetworks);
      }
    } catch (e) {
      logger.debug('ContractDefinitionSettingsPanel', 'Load saved defaultProvider failed:', e);
    }
  }, [networkId, setValue, providerOptions]);

  const onSubmit = useCallback(
    (data: FormData): void => {
      try {
        // Always persist a network record for visibility in this network
        const existingForNetwork = userExplorerConfigService.getUserExplorerConfig(networkId);
        const baseNetwork: UserExplorerConfig = existingForNetwork ?? {
          isCustom: true,
          name: 'Custom Explorer',
        };
        const networkConfig: UserExplorerConfig = {
          ...baseNetwork,
          ...(data.defaultProvider ? { defaultProvider: data.defaultProvider } : {}),
          applyToAllNetworks: data.applyToAllNetworks,
          appliedNetworkIds: data.applyToAllNetworks ? undefined : [networkId],
        };
        userExplorerConfigService.saveUserExplorerConfig(networkId, networkConfig);

        // When applying to all networks, also persist to global key
        if (data.applyToAllNetworks) {
          const existingGlobal = userExplorerConfigService.getUserExplorerConfig('__global__');
          const baseGlobal: UserExplorerConfig = existingGlobal ?? {
            isCustom: true,
            name: 'Custom Explorer',
          };
          const globalConfig: UserExplorerConfig = {
            ...baseGlobal,
            ...(data.defaultProvider ? { defaultProvider: data.defaultProvider } : {}),
            applyToAllNetworks: true,
          };
          userExplorerConfigService.saveUserExplorerConfig('__global__', globalConfig);
        }
        onSettingsChanged?.();
        setResult({ type: 'success', message: 'Settings saved successfully' });
      } catch (e) {
        logger.error('ContractDefinitionSettingsPanel', 'Save defaultProvider failed:', e);
        setResult({ type: 'error', message: 'Failed to save settings' });
      }
    },
    [networkId, onSettingsChanged]
  );

  const onReset = useCallback((): void => {
    try {
      const existing = userExplorerConfigService.getUserExplorerConfig(networkId);
      if (!existing) {
        setValue('defaultProvider', '');
        onSettingsChanged?.();
        return;
      }
      // Remove defaultProvider while preserving other fields
      const updatedConfig = { ...(existing as UserExplorerConfig) };
      delete updatedConfig.defaultProvider;
      userExplorerConfigService.saveUserExplorerConfig(
        networkId,
        updatedConfig as UserExplorerConfig
      );
      // If applying to all networks is currently set, clear global as well
      const applyAll = watch('applyToAllNetworks');
      if (applyAll) {
        userExplorerConfigService.clearUserExplorerConfig('__global__');
      }
      setValue('defaultProvider', '');
      onSettingsChanged?.();
      setResult({ type: 'success', message: 'Settings reset successfully' });
    } catch (e) {
      logger.error('ContractDefinitionSettingsPanel', 'Reset defaultProvider failed:', e);
      setResult({ type: 'error', message: 'Failed to reset settings' });
    }
  }, [networkId, onSettingsChanged, setValue, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">Contract Definition Provider</AlertTitle>
        <AlertDescription className="space-y-1 text-xs">
          <p className="mt-2">
            Select which provider the builder should try first when loading verified contract
            definitions. Deep links can override this preference temporarily.
          </p>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {providerOptions.length > 0 ? (
          <SelectField<FormData>
            id="defaultProvider"
            name="defaultProvider"
            label="Default Contract Definition Provider"
            placeholder="Select a provider"
            helperText="Used as the first provider to query for contract definitions."
            control={control}
            options={providerOptions.map((opt) => ({ value: opt.key, label: opt.label }))}
            width="full"
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            No provider options available for this network.
          </div>
        )}

        <div className="ml-0">
          <BooleanField<FormData>
            id="applyToAllNetworks"
            name="applyToAllNetworks"
            control={control}
            label="Apply to all compatible networks"
            helperText="Apply this default provider setting to all compatible networks in your project."
          />
        </div>
      </div>

      <SettingsFooter
        onPrimary={handleSubmit(onSubmit)}
        onSecondary={onReset}
        primaryLabel="Save Settings"
        result={result}
        disabled={providerOptions.length === 0}
      />
    </form>
  );
}
