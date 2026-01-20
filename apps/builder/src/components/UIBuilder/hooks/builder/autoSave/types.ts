import { ExecutionConfig, RenderFormSchema, UiKitConfiguration } from '@openzeppelin/ui-types';

/**
 * Type definition for the saved configuration data structure
 * This matches the ContractUIRecord structure from the storage package
 */
export interface SavedConfigurationData {
  title: string;
  ecosystem: string;
  networkId: string;
  contractAddress: string;
  functionId: string;
  formConfig: RenderFormSchema;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
}

/**
 * Auto-save hook return type
 */
export interface AutoSaveHookReturn {
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
}
