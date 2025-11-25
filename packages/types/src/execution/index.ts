import type { EoaExecutionConfig } from './eoa';
import type { MultisigExecutionConfig } from './multisig';
import type { RelayerExecutionConfig } from './relayer';

export * from './eoa';
export * from './multisig';
export * from './relayer';

/**
 * Execution configuration type (union of all execution methods)
 */
export type ExecutionConfig = EoaExecutionConfig | RelayerExecutionConfig | MultisigExecutionConfig;
