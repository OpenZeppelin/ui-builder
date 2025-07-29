// Base classes
export { DexieStorage } from './base/DexieStorage';
export type { BaseRecord } from './base/DexieStorage';

// Services
export { ContractUIStorage, contractUIStorage } from './services/ContractUIStorage';

// Hooks
export { useContractUIStorage } from './hooks/useContractUIStorage';
export type { UseContractUIStorageReturn } from './hooks/useContractUIStorage';

// Types
export type { ContractUIRecord, ContractUIExportData } from './types';

// Database (for advanced usage)
export { db } from './database/db';
