import type { BaseRecord } from '@openzeppelin/ui-storage';
import type {
  ContractDefinitionMetadata,
  ExecutionConfig,
  RenderFormSchema,
  UiKitConfiguration,
} from '@openzeppelin/ui-types';

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
  /**
   * Chain-agnostic contract definition artifacts required for adapters that need
   * additional inputs beyond a single definition. Example: Midnight requires
   * private state ID, compiled module, and optional witness code.
   */
  contractDefinitionArtifacts?: Record<string, unknown>;
}

export interface ContractUIExportData {
  version: string;
  exportedAt: string;
  configurations: ContractUIRecord[];
}
