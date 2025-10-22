import type {
  BalancedTransaction,
  MidnightProvider,
  MidnightProviders,
  UnbalancedTransaction,
  WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';

import type { MidnightNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { getWalletConfigIfAvailable } from '../configuration/provider';
import type { LaceWalletImplementation } from '../wallet/implementation/lace-implementation';
import { EmbeddedZkConfigProvider } from './embedded-zk-config-provider';

/**
 * Global instance of the ZK config provider
 * This is shared across all transactions and populated when artifacts are loaded
 */
export const globalZkConfigProvider = new EmbeddedZkConfigProvider();

/**
 * Creates all 5 required Midnight providers for transaction execution
 * Pattern: mirrors bboard-ui/src/contexts/BrowserDeployedBoardManager.ts lines 202-232
 *
 * Uses dynamic imports to avoid loading WASM dependencies at module initialization
 */
export async function createTransactionProviders(
  walletImplementation: LaceWalletImplementation,
  networkConfig: MidnightNetworkConfig
): Promise<MidnightProviders> {
  const api = walletImplementation.getApi();
  if (!api) {
    throw new Error('Wallet not connected');
  }

  const walletState = await api.state();
  if (!walletState || !walletState.coinPublicKey) {
    throw new Error('Unable to retrieve wallet state');
  }

  logger.debug('createTransactionProviders', 'Wallet state:', {
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    address: walletState.address,
  });

  // Get wallet configuration (may include user privacy preferences)
  const walletConfig = await getWalletConfigIfAvailable();

  // Resolve endpoints with precedence:
  // 1. Wallet config (user privacy preferences)
  // 2. Network config (explicit configuration)
  // 3. Derived from RPC endpoint (fallback)
  const defaultRpc = networkConfig.rpcEndpoints?.default;
  if (!defaultRpc && (!networkConfig.indexerUri || !networkConfig.indexerWsUri)) {
    throw new Error(
      'Midnight network RPC endpoints are not configured. Please set networkConfig.rpcEndpoints.default or provide explicit indexer URIs.'
    );
  }

  const indexerUri = networkConfig.indexerUri || deriveIndexerUri(defaultRpc as string);
  const indexerWsUri = networkConfig.indexerWsUri || deriveIndexerWsUri(defaultRpc as string);

  // Proof server URI priority: wallet config > network config > derive from RPC
  const networkConfigAny = networkConfig as unknown as Record<string, unknown>;
  const proofServerUri =
    walletConfig?.proverServerUri ||
    (networkConfigAny.proofServerUri as string | undefined) ||
    deriveProofServerUri(defaultRpc as string);

  logger.info('createTransactionProviders', 'Initializing providers', {
    indexerUri,
    proofServerUri,
    proofServerSource: walletConfig?.proverServerUri
      ? 'wallet'
      : networkConfigAny.proofServerUri
        ? 'network'
        : 'derived',
  });

  // Dynamic imports to avoid loading at module initialization
  const [
    { indexerPublicDataProvider },
    { httpClientProofProvider },
    { levelPrivateStateProvider },
    { getLedgerNetworkId, getZswapNetworkId },
    { createBalancedTx },
    { Transaction },
    { Transaction: ZswapTransaction },
  ] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
    import('@midnight-ntwrk/midnight-js-level-private-state-provider'),
    import('@midnight-ntwrk/midnight-js-network-id'),
    import('@midnight-ntwrk/midnight-js-types'),
    import('@midnight-ntwrk/ledger'),
    import('@midnight-ntwrk/zswap'),
  ]);

  // 1. Private state provider (IndexedDB-backed for browser)
  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: `midnight-private-state-${networkConfig.id}`,
  });

  // 2. ZK config provider (uses global embedded provider)
  // Artifacts are registered with this provider when the ZIP is uploaded
  const zkConfigProvider = globalZkConfigProvider;
  logger.info(
    'createTransactionProviders',
    'Using EmbeddedZkConfigProvider with circuits:',
    zkConfigProvider.getCircuitIds()
  );

  // 3. Proof provider (HTTP client to proof server)
  const proofProvider = httpClientProofProvider(proofServerUri);

  // 4. Public data provider (already used in queries)
  const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);

  // 5. Wallet + Midnight provider (combined)
  // Pattern: lines 213-230 of bboard-ui example

  // Debug: Log the coin public key format
  logger.debug(
    'createTransactionProviders',
    'Creating wallet provider with coinPublicKey:',
    walletState.coinPublicKey
  );

  const walletProvider: WalletProvider = {
    coinPublicKey: walletState.coinPublicKey,
    encryptionPublicKey: walletState.encryptionPublicKey,
    balanceTx(tx: UnbalancedTransaction, newCoins: unknown[]): Promise<BalancedTransaction> {
      type CoinsParam = Parameters<typeof api.balanceAndProveTransaction>[1];
      const coins = newCoins as unknown as CoinsParam;
      return api
        .balanceAndProveTransaction(
          ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          coins
        )
        .then((zswapTx) =>
          Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId())
        )
        .then(createBalancedTx);
    },
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx: BalancedTransaction): Promise<string> {
      logger.debug('MidnightProvider', 'Submitting transaction:', {
        txType: typeof tx,
        txKeys: tx ? Object.keys(tx) : null,
        hasSerialize: tx && typeof (tx as { serialize?: unknown }).serialize === 'function',
      });

      const result = (await api.submitTransaction(tx)) as unknown;
      if (typeof result === 'string') return result;
      if (result && typeof result === 'object') {
        const r = result as { txHash?: string; hash?: string };
        return r.txHash || r.hash || '';
      }
      return '';
    },
  };

  return {
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider,
  } as unknown as MidnightProviders;
}

// Helper functions (mirror query handler logic)
function deriveIndexerUri(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  if (url.protocol === 'ws:') url.protocol = 'http:';
  else if (url.protocol === 'wss:') url.protocol = 'https:';
  url.pathname = '/api/v1/graphql';
  return url.toString();
}

function deriveIndexerWsUri(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  else if (url.protocol === 'https:') url.protocol = 'wss:';
  url.pathname = '/api/v1/graphql';
  return url.toString();
}

function deriveProofServerUri(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  if (url.protocol === 'ws:') url.protocol = 'http:';
  else if (url.protocol === 'wss:') url.protocol = 'https:';
  // The proof server endpoint is at the root /prove-tx, not under /api/v1/proof
  // Remove any existing path to get the base URL
  url.pathname = '';
  return url.toString();
}
