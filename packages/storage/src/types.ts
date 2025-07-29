import type {
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
}

export interface ContractUIExportData {
  version: string;
  exportedAt: string;
  configurations: ContractUIRecord[];
}

// Re-export for convenience
export type { BaseRecord };
