import type { NetworkServiceForm } from '@openzeppelin/ui-builder-types';
import { UserExplorerConfig, UserRpcProviderConfig } from '@openzeppelin/ui-builder-types';
import { appConfigService, userNetworkServiceConfigService } from '@openzeppelin/ui-builder-utils';

import { TypedEvmNetworkConfig } from '../types';
import { EvmProviderKeys, isEvmProviderKey } from '../types/providers';
import { testEvmExplorerConnection, validateEvmExplorerConfig } from './explorer';
import { testEvmRpcConnection, validateEvmRpcEndpoint } from './rpc';

/**
 * Returns the network service forms for EVM networks.
 * Defines the UI configuration for RPC, Explorer, and Contract Definitions services.
 */
export function getEvmNetworkServiceForms(
  networkConfig: TypedEvmNetworkConfig
): NetworkServiceForm[] {
  const globalV2ApiKey = appConfigService.getGlobalServiceConfig('etherscanv2')?.apiKey as
    | string
    | undefined;
  const v2DefaultEnabled = Boolean(globalV2ApiKey);
  // Read any saved contract-definitions config to seed defaults in the UI
  const savedContractDefCfg = userNetworkServiceConfigService.get(
    networkConfig.id,
    'contract-definitions'
  ) as Record<string, unknown> | null;
  const savedDefaultProvider =
    savedContractDefCfg && typeof savedContractDefCfg.defaultProvider === 'string'
      ? (savedContractDefCfg.defaultProvider as string)
      : undefined;
  return [
    {
      id: 'rpc',
      label: 'RPC Provider',
      description:
        'Setting your own RPC endpoint ensures better reliability, faster response times, and higher rate limits. Public endpoints may be rate-limited or experience congestion during high traffic periods.',
      fields: [
        {
          id: 'evm-rpc-url',
          name: 'rpcUrl',
          type: 'text',
          label: 'RPC URL',
          placeholder: 'https://mainnet.infura.io/v3/your-key',
          validation: { required: true, pattern: '^https?://.+' },
          width: 'full',
        },
      ],
    },
    {
      id: 'explorer',
      label: 'Block Explorer',
      description:
        'Public API keys are rate-limited and may be exhausted quickly. Using your own key ensures reliable access to explorer services.',
      fields: [
        // Adapter-led informational notes (rendered generically by the panel)
        {
          id: 'evm-explorer-note-etherscan',
          name: '_note_etherscan',
          type: 'hidden',
          label: '',
          validation: {},
          isHidden: true,
          metadata: {
            note: {
              variant: 'warning',
              title: 'Etherscan API Support',
              html: true,
              lines: [
                '<strong>V2 API (Recommended):</strong> Supports all Etherscan-compatible explorers across multiple chains with a single API key.',
                '<strong>V1 API (Legacy):</strong> Requires chain-specific API endpoints. Some explorers may not be supported.',
                '<strong>Note:</strong> Non-Etherscan explorers (Blockscout, Routescan, etc.) are not supported.',
              ],
            },
          },
        },
        {
          id: 'evm-explorer-api-key',
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          placeholder: 'Your explorer API key',
          helperText: 'Required for fetching contract ABIs and other API operations',
          validation: {},
          width: 'full',
        },
        {
          id: 'evm-explorer-use-v2',
          name: 'useV2Api',
          type: 'checkbox',
          label: 'Use Etherscan V2 API',
          helperText:
            'Enable the new V2 API for all Etherscan-compatible networks. V2 provides unified access across all chains.',
          validation: {},
          defaultValue: v2DefaultEnabled,
          metadata: {
            section: 'api-config',
            sectionLabel: 'API Configuration',
            sectionHelp: 'Configure API version and network application settings.',
          },
        },
        {
          id: 'evm-explorer-apply-all',
          name: 'applyToAllNetworks',
          type: 'checkbox',
          label: 'Apply to all compatible networks',
          helperText: 'Apply these settings to all Etherscan-compatible networks in your project.',
          validation: {},
          defaultValue: v2DefaultEnabled,
          // UI hinting for generic renderer to indent under and disable when V2 is off
          metadata: {
            section: 'api-config',
            nestUnder: 'useV2Api',
            disabledWhen: { field: 'useV2Api', equals: false },
          },
        },
        {
          id: 'evm-explorer-url',
          name: 'explorerUrl',
          type: 'text',
          label: 'Explorer Base URL (optional)',
          placeholder: 'https://etherscan.io',
          validation: {},
          helperText:
            'Base URL for viewing transactions and addresses. If not provided, defaults from the network will be used.',
          width: 'full',
          metadata: {
            section: 'custom-endpoints',
            sectionLabel: 'Custom Endpoints',
            sectionHelp: 'Override default URLs for explorer and API endpoints.',
          },
        },
        {
          id: 'evm-explorer-api-url',
          name: 'apiUrl',
          type: 'text',
          label: 'Explorer API URL (legacy / V1)',
          placeholder: 'https://api.etherscan.io/api',
          validation: {},
          helperText:
            'API endpoint for fetching contract data. If not provided, defaults from the network will be used.',
          width: 'full',
          metadata: { section: 'custom-endpoints' },
        },
      ],
    },
    {
      id: 'contract-definitions',
      label: 'Contract Definitions',
      description: undefined,
      supportsConnectionTest: false,
      fields: [
        // Informational note
        {
          id: 'evm-contract-def-note',
          name: '_note_contract_def',
          type: 'hidden',
          label: '',
          validation: {},
          isHidden: true,
          metadata: {
            hideTestConnection: true,
            note: {
              variant: 'info',
              title: 'Contract Definition Provider',
              lines: [
                'Select which provider the builder should try first when loading verified contract definitions. Deep links can override this preference temporarily.',
              ],
            },
          },
        },
        // Default provider select
        {
          id: 'evm-contract-def-provider',
          name: 'defaultProvider',
          type: 'select',
          label: 'Default Contract Definition Provider',
          placeholder: 'Select a provider',
          helperText: 'Used as the first provider to query for contract definitions.',
          validation: {},
          options: [
            { label: 'Etherscan', value: EvmProviderKeys.Etherscan },
            { label: 'Sourcify', value: EvmProviderKeys.Sourcify },
          ],
          // Seed from saved user config or app-config default if present; otherwise empty
          defaultValue:
            savedDefaultProvider ||
            (appConfigService.getGlobalServiceParam('contractdefinition', 'defaultProvider') as
              | string
              | undefined) ||
            '',
          width: 'full',
        },
        // Apply to all networks
        {
          id: 'evm-contract-def-apply-all',
          name: 'applyToAllNetworks',
          type: 'checkbox',
          label: 'Apply to all compatible networks',
          helperText:
            'Apply this default provider setting to all compatible networks in your project.',
          validation: {},
          defaultValue: false,
          metadata: {
            nestUnder: 'defaultProvider',
            disabledWhen: { field: 'defaultProvider', equals: '' },
          },
        },
      ],
    },
  ];
}

/**
 * Validates a network service configuration for EVM networks.
 */
export async function validateEvmNetworkServiceConfig(
  serviceId: string,
  values: Record<string, unknown>
): Promise<boolean> {
  if (serviceId === 'rpc') {
    const cfg = { url: String(values.rpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
    return validateEvmRpcEndpoint(cfg);
  }
  if (serviceId === 'explorer') {
    const cfg = {
      explorerUrl: values.explorerUrl ? String(values.explorerUrl) : undefined,
      apiUrl: values.apiUrl ? String(values.apiUrl) : undefined,
      apiKey: values.apiKey ? String(values.apiKey) : undefined,
      isCustom: true,
      applyToAllNetworks: Boolean(values.applyToAllNetworks),
    } as UserExplorerConfig;
    return validateEvmExplorerConfig(cfg);
  }
  if (serviceId === 'contract-definitions') {
    const raw = values.defaultProvider;
    if (raw === undefined || raw === null || raw === '') return true;
    return isEvmProviderKey(raw);
  }
  return true;
}

/**
 * Tests a network service connection for EVM networks.
 */
export async function testEvmNetworkServiceConnection(
  serviceId: string,
  values: Record<string, unknown>,
  networkConfig: TypedEvmNetworkConfig
): Promise<{ success: boolean; latency?: number; error?: string }> {
  if (serviceId === 'rpc') {
    const cfg = { url: String(values.rpcUrl || ''), isCustom: true } as UserRpcProviderConfig;
    return testEvmRpcConnection(cfg);
  }
  if (serviceId === 'explorer') {
    const cfg = {
      explorerUrl: values.explorerUrl ? String(values.explorerUrl) : undefined,
      apiUrl: values.apiUrl ? String(values.apiUrl) : undefined,
      apiKey: values.apiKey ? String(values.apiKey) : undefined,
      isCustom: true,
      applyToAllNetworks: Boolean(values.applyToAllNetworks),
    } as UserExplorerConfig;
    return testEvmExplorerConnection(cfg, networkConfig);
  }
  return { success: true };
}
