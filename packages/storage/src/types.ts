import type {
  ContractDefinitionMetadata,
  ExecutionConfig,
  RenderFormSchema,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

import type { BaseRecord } from './base/DexieStorage';

export interface ContractUIRecord extends BaseRecord {
  title: string;
  ecosystem: string;
  networkId: string;

  // Database indexing fields for efficient queries and search
  contractAddress: string; // Indexed for fast lookup by contract address
  functionId: string; // Indexed for finding all UIs for a specific function

  // Runtime configuration objects (contain same fields for different architectural purposes)
  formConfig: RenderFormSchema; // Contains contractAddress/functionId for form rendering context
  executionConfig?: ExecutionConfig; // Persistent transaction execution settings
  uiKitConfig?: UiKitConfiguration;
  metadata?: Record<string, unknown>;

  // Contract Definition Storage Fields
  contractDefinition?: string; // Primary contract definition used for UI generation (normalized/processed)
  contractDefinitionOriginal?: string; // Original raw contract definition for data lineage (manual: same as contractDefinition, fetched: raw from explorer)
  contractDefinitionSource?: 'fetched' | 'manual';
  contractDefinitionMetadata?: ContractDefinitionMetadata; // Metadata about fetch process (excludes definition content)
}

export interface ContractUIExportData {
  version: string;
  exportedAt: string;
  configurations: ContractUIRecord[];
}

// Re-export for convenience
export type { BaseRecord };
