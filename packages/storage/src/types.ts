import type {
  ContractSchemaMetadata,
  ExecutionConfig,
  RenderFormSchema,
  UiKitConfiguration,
} from '@openzeppelin/contracts-ui-builder-types';

import type { BaseRecord } from './base/DexieStorage';

export interface ContractUIRecord extends BaseRecord {
  title: string;
  ecosystem: string;
  networkId: string;
  contractAddress: string;
  functionId: string;
  formConfig: RenderFormSchema;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
  metadata?: Record<string, unknown>;

  // Contract Schema Storage Fields
  contractSchema?: string; // JSON string of the contract schema
  schemaSource: 'fetched' | 'manual' | 'hybrid';
  schemaHash?: string; // SHA-256 hash for quick comparison
  lastSchemaFetched?: Date; // When schema was last fetched from block explorer
  schemaMetadata?: ContractSchemaMetadata;
}

export interface ContractUIExportData {
  version: string;
  exportedAt: string;
  configurations: ContractUIRecord[];
}

// Re-export for convenience
export type { BaseRecord };
