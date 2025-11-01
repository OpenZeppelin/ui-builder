/**
 * Defines the possible states for a transaction lifecycle.
 */
export type TxStatus =
  | 'idle' // No transaction in progress
  | 'pendingSignature' // Waiting for user to sign in wallet
  | 'pendingConfirmation' // Transaction submitted, waiting for blockchain confirmation
  | 'pendingRelayer' // Transaction submitted, waiting for relayer to acknowledge
  | 'success' // Transaction confirmed successfully
  | 'error'; // Transaction failed or was rejected

/**
 * Represents the details passed along with a status update.
 * It can contain the following optional fields:
 * - `transactionId`: Provided by a relayer.
 * - `txHash`: Provided by a direct broadcast.
 * - `title`: Optional UI copy for a better chain-specific UX.
 * - `message`: Optional UI copy for a better chain-specific UX.
 */
export type TransactionStatusUpdate = {
  transactionId?: string;
  txHash?: string;
  title?: string;
  message?: string;
};
