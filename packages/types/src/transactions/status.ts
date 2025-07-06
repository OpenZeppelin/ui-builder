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
 * It can contain a `transactionId` (from a relayer) or a `txHash` (from a direct broadcast).
 */
export type TransactionStatusUpdate = {
  transactionId?: string;
  txHash?: string;
};
