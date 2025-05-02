/**
 * Defines the possible states for a transaction lifecycle.
 */
export type TransactionStatus =
  | 'idle' // No transaction in progress
  | 'pendingSignature' // Waiting for user to sign in wallet
  | 'pendingConfirmation' // Transaction submitted, waiting for network confirmation
  | 'success' // Transaction confirmed successfully
  | 'error'; // Transaction failed or was rejected
