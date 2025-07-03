import type {
  ContractAdapter,
  EoaExecutionConfig,
  ExecutionConfig,
  ExecutionMethodType,
  RelayerDetails,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';

import { ExecutionMethodFormData } from '../types';

/**
 * Validates the EOA-specific configuration for the UI builder.
 * @param config The execution configuration to validate.
 * @param adapter The contract adapter, used for address validation.
 * @returns An error message string if validation fails, otherwise null.
 */
const _validateEoaForBuilder = (
  config: ExecutionConfig,
  adapter: ContractAdapter
): string | null => {
  const eoaConfig = config as EoaExecutionConfig;
  if (!eoaConfig.allowAny) {
    if (!eoaConfig.specificAddress) {
      return 'Please provide the specific EOA address.';
    }
    if (!adapter.isValidAddress(eoaConfig.specificAddress)) {
      return `Invalid EOA address format: ${eoaConfig.specificAddress}`;
    }
  }
  return null;
};

/**
 * Validates the Relayer-specific configuration for the UI builder.
 * @param config The execution configuration to validate.
 * @returns An error message string if validation fails, otherwise null.
 */
const _validateRelayerForBuilder = (
  config: ExecutionConfig,
  _adapter: ContractAdapter
): string | null => {
  const relayerConfig = config as RelayerExecutionConfig;
  if (!relayerConfig.serviceUrl) {
    return 'Please provide the Relayer Service URL.';
  }
  if (!relayerConfig.relayer?.relayerId) {
    return 'Please provide the Relayer API Key, fetch relayers and select a relayer from the list.';
  }
  return null;
};

/**
 * A map of validation functions for each execution method.
 * This allows for a declarative and extensible way to handle validation logic.
 */
export const executionMethodValidatorMap: Record<
  ExecutionMethodType,
  (config: ExecutionConfig, adapter: ContractAdapter) => string | null
> = {
  eoa: _validateEoaForBuilder,
  relayer: _validateRelayerForBuilder,
  multisig: () => null, // Placeholder for multisig
};

/**
 * Generates the default form values for the execution method form based on the current configuration.
 * This centralizes the complex logic for setting default states for different execution methods.
 * @param currentConfig The current execution configuration from the form builder's state.
 * @returns An object with the appropriate default values for the form.
 */
export function generateDefaultExecutionMethodFormValues(
  currentConfig?: ExecutionConfig
): ExecutionMethodFormData {
  const defaults: ExecutionMethodFormData = {
    executionMethodType: currentConfig?.method || 'eoa',
    eoaOption: 'any',
    specificEoaAddress: '',
    relayerServiceUrl: '',
    selectedRelayer: '',
    selectedRelayerDetails: undefined,
  };

  if (currentConfig?.method === 'eoa') {
    defaults.eoaOption = currentConfig.allowAny === false ? 'specific' : 'any';
    defaults.specificEoaAddress = currentConfig.specificAddress || '';
  } else if (currentConfig?.method === 'relayer') {
    defaults.relayerServiceUrl = currentConfig.serviceUrl || '';
    defaults.selectedRelayer = currentConfig.relayer?.relayerId || '';
    defaults.selectedRelayerDetails = currentConfig.relayer;
  }

  return defaults;
}

/**
 * Maps the raw form data from the UI into a partial ExecutionConfig object.
 * This is necessary because the form's data structure (e.g., using `eoaOption`)
 * differs from the final configuration's structure (e.g., using `allowAny`).
 * @param formData The raw data from the `ExecutionMethodFormData` form.
 * @returns A `Partial<ExecutionConfig>` object.
 */
export function mapFormDataToExecutionConfig(
  formData: Partial<ExecutionMethodFormData>
): Partial<ExecutionConfig> {
  const {
    executionMethodType,
    eoaOption,
    specificEoaAddress,
    relayerServiceUrl,
    selectedRelayerDetails,
  } = formData;

  switch (executionMethodType) {
    case 'eoa':
      return {
        method: 'eoa',
        allowAny: eoaOption === 'any',
        specificAddress: specificEoaAddress,
      };
    case 'relayer':
      return {
        method: 'relayer',
        serviceUrl: relayerServiceUrl,
        relayer: selectedRelayerDetails ? selectedRelayerDetails : undefined,
      };
    case 'multisig':
      return { method: 'multisig' };
    default:
      return { method: executionMethodType };
  }
}

const executionMethodConfigMap: Record<
  ExecutionMethodType,
  (config: Partial<ExecutionConfig>) => ExecutionConfig
> = {
  eoa: (config) => ({
    method: 'eoa',
    allowAny: (config as EoaExecutionConfig).allowAny ?? true,
    specificAddress: (config as EoaExecutionConfig).specificAddress,
  }),
  relayer: (config) => ({
    method: 'relayer',
    serviceUrl: (config as RelayerExecutionConfig).serviceUrl || '',
    relayer: (config as RelayerExecutionConfig).relayer || ({} as RelayerDetails),
  }),
  multisig: (_config) => ({
    method: 'multisig',
  }),
};

/**
 * Helper to ensure the config object has the correct structure based on the method.
 * Returns undefined if the config is fundamentally incomplete (e.g., method not set).
 */
export function ensureCompleteConfig(
  partialConfig: Partial<ExecutionConfig> | undefined | null // Allow undefined/null input
): ExecutionConfig | undefined {
  if (!partialConfig || !partialConfig.method) return undefined;

  const configBuilder = executionMethodConfigMap[partialConfig.method];

  if (configBuilder) {
    return configBuilder(partialConfig);
  }

  // Handle potential invalid method types if ExecutionMethodType allows more
  console.warn(`ensureCompleteConfig: Unknown method type encountered: ${partialConfig.method}`);
  return undefined;
}
