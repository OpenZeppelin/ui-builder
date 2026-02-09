/**
 * EVM Access Control Types
 *
 * Internal type definitions for the access control module.
 * These types are used across the module's implementation files.
 *
 * @module access-control/types
 */

import type {
  AccessControlCapabilities,
  ContractSchema,
  ExecutionConfig,
  OperationResult,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-types';

import type { WriteContractParameters } from '../types';

/**
 * In-memory context stored per registered contract.
 *
 * Not persisted — created on `registerContract()`, enriched on capability
 * detection and role discovery, removed on `dispose()`.
 *
 * Identity: Keyed by normalized (lowercased) `contractAddress` in a
 * `Map<string, EvmAccessControlContext>`.
 */
export interface EvmAccessControlContext {
  /** Normalized (lowercased) EVM address with `0x` prefix */
  contractAddress: string;

  /** Parsed ABI as ContractSchema (from adapter's `loadContract`) */
  contractSchema: ContractSchema;

  /** Role IDs explicitly provided via `registerContract()` or `addKnownRoleIds()` (bytes32 hex) */
  knownRoleIds: string[];

  /** Role IDs discovered via indexer query (cached) */
  discoveredRoleIds: string[];

  /** Flag to prevent repeated discovery attempts when indexer is unavailable */
  roleDiscoveryAttempted: boolean;

  /** Cached capabilities (populated on first `getCapabilities()` call) */
  capabilities: AccessControlCapabilities | null;
}

/**
 * Transaction executor callback type.
 *
 * Provided by `EvmAdapter` to decouple the access control service from
 * wallet/signing infrastructure. The service assembles transaction data
 * (as `WriteContractParameters`) and delegates execution to this callback.
 *
 * @param txData - Assembled transaction parameters (address, abi, functionName, args)
 * @param executionConfig - Execution strategy configuration (EOA, Relayer, etc.)
 * @param onStatusChange - Optional callback for transaction status updates
 * @param runtimeApiKey - Optional API key for relayer execution
 * @returns Promise resolving to the operation result with transaction hash
 */
export type EvmTransactionExecutor = (
  txData: WriteContractParameters,
  executionConfig: ExecutionConfig,
  onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
  runtimeApiKey?: string
) => Promise<OperationResult>;
