export interface RelayerDetails {
  relayerId: string;
  name: string;
  address: string;
  network: string;
  paused: boolean;
}

export interface RelayerDetailsRich extends RelayerDetails {
  systemDisabled: boolean;
  balance?: string;
  nonce?: string;
  pendingTransactionsCount?: number;
  lastConfirmedTransactionTimestamp?: string;
}

export interface RelayerExecutionConfig {
  method: 'relayer';
  serviceUrl: string;
  relayer: RelayerDetails;
  // Chain-agnostic options - adapters will define their specific types
  transactionOptions?: Record<string, unknown>;
}
