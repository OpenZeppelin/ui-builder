/**
 * UI Module for Polkadot EVM Adapter
 *
 * Provides UI-related functions for contract definitions and UI kits.
 */

import type { ComponentType } from 'react';

import type { AvailableUiKit, ContractFunction, FormFieldType } from '@openzeppelin/ui-types';

/**
 * Get available UI kits for wallet integration.
 * Returns RainbowKit and custom options.
 */
export async function getAvailableUiKits(): Promise<AvailableUiKit[]> {
  return [
    {
      id: 'custom',
      name: 'Wagmi Custom',
      configFields: [],
    },
    {
      id: 'rainbowkit',
      name: 'RainbowKit',
      linkToDocs: 'https://www.rainbowkit.com/docs/installation#configure',
      description: `Configure RainbowKit for your exported application.`,
      hasCodeEditor: true,
      defaultCode: '// RainbowKit configuration',
      configFields: [],
    },
  ];
}

/**
 * Get inputs for the contract definition form.
 * Returns standard EVM contract definition fields.
 */
export function getContractDefinitionInputs(): FormFieldType[] {
  return [
    {
      id: 'contractAddress',
      name: 'contractAddress',
      label: 'Contract Address',
      type: 'blockchain-address',
      validation: { required: true },
      placeholder: '0x1234...abcd',
      helperText:
        'Enter the deployed contract address. For verified contracts, the ABI will be fetched automatically from the block explorer.',
    },
    {
      id: 'contractDefinition',
      name: 'contractDefinition',
      label: 'Contract ABI (Optional)',
      type: 'code-editor',
      validation: { required: false },
      placeholder:
        '[{"inputs":[],"name":"myFunction","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
      helperText:
        "If the contract is not verified on the block explorer, paste the contract's ABI JSON here.",
      codeEditorProps: {
        language: 'json',
        placeholder: 'Paste your contract ABI JSON here...',
        maxHeight: '500px',
        performanceThreshold: 3000,
      },
    },
  ];
}

/**
 * Get UI labels for relayer configuration.
 * Returns labels for gas configuration and relayer details.
 */
export function getUiLabels(): Record<string, string> | undefined {
  return {
    relayerConfigTitle: 'Gas Configuration',
    relayerConfigActiveDesc: 'Customize gas pricing strategy for transaction submission',
    relayerConfigInactiveDesc: 'Using recommended gas configuration for reliable transactions',
    relayerConfigPresetTitle: 'Fast Speed Preset Active',
    relayerConfigPresetDesc: 'Transactions will use high priority gas pricing for quick inclusion',
    relayerConfigCustomizeBtn: 'Customize Gas Settings',
    detailsTitle: 'Relayer Details',
    network: 'Network',
    relayerId: 'Relayer ID',
    active: 'Active',
    paused: 'Paused',
    systemDisabled: 'System Disabled',
    balance: 'Balance',
    nonce: 'Nonce',
    pending: 'Pending Transactions',
    lastTransaction: 'Last Transaction',
  };
}

/**
 * Get writable (non-view) functions from a contract schema.
 * Filters functions that modify state.
 */
export function getWritableFunctions(functions: ContractFunction[]): ContractFunction[] {
  return functions.filter((fn) => fn.modifiesState);
}

/**
 * Filter out admin/upgrade management getters that often revert or require permissions.
 * Excludes functions like admin, implementation, proxyAdmin, etc.
 */
export function filterAutoQueryableFunctions(functions: ContractFunction[]): ContractFunction[] {
  const skipNames = new Set([
    'admin',
    'implementation',
    'getImplementation',
    '_implementation',
    'proxyAdmin',
    'changeAdmin',
    'upgradeTo',
    'upgradeToAndCall',
  ]);
  return functions.filter((f) => !skipNames.has(f.name));
}

/**
 * Indicates if this adapter implementation supports wallet connection.
 * Returns true for EVM-compatible Polkadot networks.
 */
export function supportsWalletConnection(): boolean {
  return true;
}

/**
 * Get relayer options component for EVM networks.
 *
 * Note: EvmRelayerOptions is not exported from adapter-evm-core.
 * Returns undefined for now until EvmRelayerOptions is properly exported.
 */
export function getRelayerOptionsComponent():
  | ComponentType<{
      options: Record<string, unknown>;
      onChange: (options: Record<string, unknown>) => void;
    }>
  | undefined {
  return undefined;
}
