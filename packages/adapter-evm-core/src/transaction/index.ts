/**
 * Transaction Module
 *
 * Transaction formatting, execution strategies, and transaction sending for EVM contracts.
 * This module structure mirrors the adapter-evm transaction/ directory.
 *
 * @module transaction
 */

// Formatting
export { formatEvmTransactionData } from './formatter';

// Execution strategy interface
export type { AdapterExecutionStrategy } from './execution-strategy';

// Execution strategies
export { EoaExecutionStrategy } from './eoa';
export { RelayerExecutionStrategy, type EvmRelayerTransactionOptions } from './relayer';

// Transaction sending and execution
export {
  executeEvmTransaction,
  signAndBroadcastEvmTransaction,
  waitForEvmTransactionConfirmation,
} from './sender';

// Types
export type {
  EvmWalletImplementation,
  EvmWalletConnectionStatus,
  EvmWalletConnectionResult,
  EvmWalletDisconnectResult,
} from './types';
