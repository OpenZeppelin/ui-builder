import type {
  BalancedTransaction,
  MidnightProvider,
  MidnightProviders,
  UnbalancedTransaction,
  WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';

import type { MidnightNetworkConfig } from '@openzeppelin/ui-types';
import {
  logger,
  userNetworkServiceConfigService,
  userRpcConfigService,
} from '@openzeppelin/ui-utils';

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

  // Resolve indexer endpoints with priority order (matches EVM/Stellar pattern):
  // 1. User RPC override (custom dev/test endpoints)
  // 2. Wallet config (Midnight-specific: respects user privacy preferences)
  // 3. Network config (explicit configuration)
  // 4. Derived from RPC endpoint (fallback)

  let indexerUri: string;
  let indexerWsUri: string;

  // Priority 1: Check for user Indexer override
  const userIndexer = userNetworkServiceConfigService.get(networkConfig.id, 'indexer') as {
    httpUrl?: string;
    wsUrl?: string;
  } | null;
  const customRpcConfig = userRpcConfigService.getUserRpcConfig(networkConfig.id);
  if (userIndexer?.httpUrl && userIndexer?.wsUrl) {
    indexerUri = userIndexer.httpUrl;
    indexerWsUri = userIndexer.wsUrl;
    logger.info('createTransactionProviders', 'Using user Indexer override', { indexerUri });
  } else if (customRpcConfig?.url) {
    // Derive indexer endpoints from custom RPC
    indexerUri = deriveIndexerUri(customRpcConfig.url);
    indexerWsUri = deriveIndexerWsUri(customRpcConfig.url);
    logger.info('createTransactionProviders', 'Using user RPC override to derive indexer URIs', {
      rpcUrl: customRpcConfig.url,
      indexerUri,
    });
  } else if (walletConfig?.indexerUri && walletConfig?.indexerWsUri) {
    // Priority 2: Respect user privacy preferences from wallet
    indexerUri = walletConfig.indexerUri;
    indexerWsUri = walletConfig.indexerWsUri;
    logger.info(
      'createTransactionProviders',
      'Using wallet-provided indexer URIs (user privacy preferences)'
    );
  } else if (networkConfig.indexerUri && networkConfig.indexerWsUri) {
    // Priority 3: Explicit network configuration
    indexerUri = networkConfig.indexerUri;
    indexerWsUri = networkConfig.indexerWsUri;
    logger.info('createTransactionProviders', 'Using explicit network-configured indexer URIs');
  } else {
    // Priority 4: Derive from RPC endpoint as fallback
    const defaultRpc = networkConfig.rpcEndpoints?.default;
    if (!defaultRpc) {
      throw new Error(
        'No indexer URIs available. Please configure indexerUri/indexerWsUri in network config or provide an RPC endpoint.'
      );
    }
    indexerUri = deriveIndexerUri(defaultRpc);
    indexerWsUri = deriveIndexerWsUri(defaultRpc);
    logger.info('createTransactionProviders', 'Derived indexer URIs from network RPC endpoint', {
      rpcUrl: defaultRpc,
      indexerUri,
    });
  }

  // Proof server URI must come from wallet - there's no public proof server
  if (!walletConfig?.proverServerUri) {
    throw new Error(
      'Proof server URI not available. Please ensure the Lace wallet is connected and configured correctly. ' +
        'The proof server is required for generating zero-knowledge proofs for transactions.'
    );
  }

  const proofServerUri = walletConfig.proverServerUri;

  logger.info('createTransactionProviders', 'Initializing providers', {
    indexerUri,
    proofServerUri,
    proofServerSource: 'wallet',
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
  // Use defaults from the SDK to ensure consistency across environments
  const privateStateProvider = levelPrivateStateProvider();

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

  // Type assertion: MidnightProviders is a generic type with specific circuit ID, private state ID,
  // and private state type parameters. Since we're working with dynamically loaded contracts,
  // we use the base MidnightProviders type without specific generics. The providers are correctly
  // typed individually, so this cast is safe and simply widens the type for flexibility.
  return {
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider,
  } as MidnightProviders;
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
  url.pathname = '/api/v1/graphql/ws';
  return url.toString();
}
