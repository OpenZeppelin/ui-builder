/**
 * Network Service Configuration for Polkadot EVM Adapter
 *
 * Defines UI configuration for RPC, Explorer, and Contract Definitions services.
 *
 * @remarks
 * Validation and connection testing are handled by adapter-evm-core.
 * This file only contains the UI form definitions specific to Polkadot networks.
 */

import {
  EvmProviderKeys,
  resolveExplorerApiKeyFromAppConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { NetworkServiceForm } from '@openzeppelin/ui-types';
import { appConfigService, userNetworkServiceConfigService } from '@openzeppelin/ui-utils';

import type { TypedPolkadotNetworkConfig } from '../../types';

/**
 * Returns the default service configuration values for a given service ID.
 * Used for proactive health checks when no user overrides are configured.
 *
 * @param networkConfig The network configuration
 * @param serviceId The service identifier (e.g., 'rpc', 'explorer', 'contract-definitions')
 * @returns The default configuration values, or null if not available
 */
export function getPolkadotDefaultServiceConfig(
  networkConfig: TypedPolkadotNetworkConfig,
  serviceId: string
): Record<string, unknown> | null {
  switch (serviceId) {
    case 'rpc':
      if (networkConfig.rpcUrl) {
        return { rpcUrl: networkConfig.rpcUrl };
      }
      break;
    case 'explorer': {
      // For explorer service, we need to include the API key if available
      // Use the shared helper from adapter-evm-core to resolve the API key
      const apiKey = resolveExplorerApiKeyFromAppConfig(networkConfig);

      // Return config if we have at least an explorer URL or an API key
      if (networkConfig.explorerUrl || apiKey) {
        return {
          explorerUrl: networkConfig.explorerUrl,
          apiUrl: networkConfig.apiUrl,
          ...(apiKey ? { apiKey } : {}),
        };
      }
      break;
    }
    case 'contract-definitions':
      // No connection test for contract definitions service
      return null;
  }
  return null;
}

/**
 * Get explorer label based on network category.
 */
function getExplorerLabel(networkConfig: TypedPolkadotNetworkConfig): string {
  return networkConfig.networkCategory === 'hub' ? 'Blockscout' : 'Moonscan';
}

/**
 * Returns the network service forms for Polkadot EVM networks.
 * Defines the UI configuration for RPC, Explorer, and Contract Definitions services.
 */
export function getNetworkServiceForms(
  networkConfig: TypedPolkadotNetworkConfig
): NetworkServiceForm[] {
  const globalV2ApiKey = appConfigService.getGlobalServiceConfig('etherscanv2')?.apiKey as
    | string
    | undefined;
  const v2DefaultEnabled = Boolean(globalV2ApiKey);
  const savedContractDefCfg = userNetworkServiceConfigService.get(
    networkConfig.id,
    'contract-definitions'
  ) as Record<string, unknown> | null;
  const savedDefaultProvider =
    savedContractDefCfg && typeof savedContractDefCfg.defaultProvider === 'string'
      ? (savedContractDefCfg.defaultProvider as string)
      : undefined;
  const explorerLabel = getExplorerLabel(networkConfig);

  return [
    {
      id: 'rpc',
      label: 'RPC Provider',
      description:
        'Setting your own RPC endpoint ensures better reliability, faster response times, and higher rate limits. Public endpoints may be rate-limited or experience congestion during high traffic periods.',
      fields: [
        {
          id: 'polkadot-rpc-url',
          name: 'rpcUrl',
          type: 'text',
          label: 'RPC URL',
          placeholder: 'https://rpc.polkadot.io',
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
        {
          id: 'polkadot-explorer-note',
          name: '_note_explorer',
          type: 'hidden',
          label: '',
          validation: {},
          isHidden: true,
          metadata: {
            note: {
              variant: 'info',
              title: `${explorerLabel} API`,
              html: true,
              lines: [
                `<strong>${explorerLabel}:</strong> The primary block explorer for this network.`,
                networkConfig.networkCategory === 'hub'
                  ? '<strong>Note:</strong> Hub networks use Blockscout API (V1 compatible).'
                  : '<strong>Note:</strong> Parachain networks use Moonscan (Etherscan V2 compatible).',
              ],
            },
          },
        },
        {
          id: 'polkadot-explorer-api-key',
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          placeholder: `Your ${explorerLabel} API key`,
          helperText: 'Required for fetching contract ABIs and other API operations',
          validation: {},
          width: 'full',
        },
        {
          id: 'polkadot-explorer-use-v2',
          name: 'useV2Api',
          type: 'checkbox',
          label: `Use ${networkConfig.networkCategory === 'hub' ? 'Blockscout' : 'Etherscan V2'} API`,
          helperText:
            networkConfig.networkCategory === 'hub'
              ? 'Hub networks use Blockscout API which is V1 compatible.'
              : 'Enable the V2 API for Moonscan networks.',
          validation: {},
          defaultValue: v2DefaultEnabled && networkConfig.networkCategory !== 'hub',
          metadata: {
            section: 'api-config',
            sectionLabel: 'API Configuration',
            sectionHelp: 'Configure API version and network application settings.',
          },
        },
        {
          id: 'polkadot-explorer-apply-all',
          name: 'applyToAllNetworks',
          type: 'checkbox',
          label: 'Apply to all compatible networks',
          helperText: 'Apply these settings to all compatible networks in your project.',
          validation: {},
          defaultValue: v2DefaultEnabled,
          metadata: {
            section: 'api-config',
            nestUnder: 'useV2Api',
            disabledWhen: { field: 'useV2Api', equals: false },
          },
        },
        {
          id: 'polkadot-explorer-url',
          name: 'explorerUrl',
          type: 'text',
          label: 'Explorer Base URL (optional)',
          placeholder:
            networkConfig.networkCategory === 'hub'
              ? 'https://assethub-polkadot.blockscout.com'
              : 'https://moonbeam.moonscan.io',
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
          id: 'polkadot-explorer-api-url',
          name: 'apiUrl',
          type: 'text',
          label: 'Explorer API URL',
          placeholder:
            networkConfig.networkCategory === 'hub'
              ? 'https://assethub-polkadot.blockscout.com/api'
              : 'https://api.moonscan.io/api',
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
        {
          id: 'polkadot-contract-def-note',
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
        {
          id: 'polkadot-contract-def-provider',
          name: 'defaultProvider',
          type: 'select',
          label: 'Default Contract Definition Provider',
          placeholder: 'Select a provider',
          helperText: 'Used as the first provider to query for contract definitions.',
          validation: {},
          options: [
            {
              label: networkConfig.networkCategory === 'hub' ? 'Blockscout' : 'Moonscan',
              value: EvmProviderKeys.Etherscan,
            },
            { label: 'Sourcify', value: EvmProviderKeys.Sourcify },
          ],
          defaultValue:
            savedDefaultProvider ||
            (appConfigService.getGlobalServiceParam('contractdefinition', 'defaultProvider') as
              | string
              | undefined) ||
            '',
          width: 'full',
        },
        {
          id: 'polkadot-contract-def-apply-all',
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
