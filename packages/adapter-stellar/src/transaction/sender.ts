import { rpc as StellarRpc } from '@stellar/stellar-sdk';

import type {
  ExecutionConfig,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-builder-types';
import { logger, userRpcConfigService } from '@openzeppelin/ui-builder-utils';

import { EoaExecutionStrategy } from './eoa';
import { ExecutionStrategy } from './execution-strategy';
import type { StellarTransactionData } from './formatter';
import { RelayerExecutionStrategy } from './relayer';

const SYSTEM_LOG_TAG = 'adapter-stellar';

// --- Helper Functions ---

/**
 * Get Soroban RPC Server instance with proper configuration
 */
function getSorobanRpcServer(networkConfig: StellarNetworkConfig): StellarRpc.Server {
  const customRpcConfig = userRpcConfigService.getUserRpcConfig(networkConfig.id);
  const rpcUrl = customRpcConfig?.url || networkConfig.sorobanRpcUrl;

  if (!rpcUrl) {
    throw new Error(`No Soroban RPC URL available for network ${networkConfig.name}`);
  }

  // Allow HTTP for localhost development
  const allowHttp = new URL(rpcUrl).hostname === 'localhost';

  return new StellarRpc.Server(rpcUrl, {
    allowHttp,
  });
}

/**
 * Sign and broadcast a Stellar transaction using the strategy pattern.
 * This follows the same architecture as the EVM adapter.
 *
 * @param transactionData - The formatted transaction data from formatStellarTransactionData
 * @param executionConfig - Execution configuration specifying method (eoa, relayer, etc.)
 * @param networkConfig - Stellar network configuration
 * @param onStatusChange - Callback for status updates
 * @param runtimeApiKey - Optional session-only API key for methods like Relayer
 * @returns Promise resolving to the transaction hash
 */
export async function signAndBroadcastStellarTransaction(
  transactionData: unknown,
  executionConfig: ExecutionConfig,
  networkConfig: StellarNetworkConfig,
  onStatusChange?: (status: TxStatus, details: TransactionStatusUpdate) => void,
  runtimeApiKey?: string
): Promise<{ txHash: string }> {
  logger.info(
    SYSTEM_LOG_TAG,
    'Stellar signAndBroadcast called with executionConfig:',
    executionConfig
  );

  // Validate network config
  if (!networkConfig || networkConfig.ecosystem !== 'stellar') {
    throw new Error('Invalid Stellar network configuration provided.');
  }

  const txData = transactionData as StellarTransactionData;
  let strategy: ExecutionStrategy;

  // Select execution strategy based on method
  switch (executionConfig.method) {
    case 'eoa':
      strategy = new EoaExecutionStrategy();
      break;
    case 'relayer':
      strategy = new RelayerExecutionStrategy();
      break;
    case 'multisig':
      // TODO: Implement MultisigExecutionStrategy when Stellar multisig support is added
      throw new Error('Multisig execution method not yet implemented for Stellar.');
    default: {
      const exhaustiveCheck: never = executionConfig;
      logger.error(SYSTEM_LOG_TAG, `Unsupported execution method encountered: ${exhaustiveCheck}`);
      throw new Error(`Unsupported execution method: ${exhaustiveCheck}`);
    }
  }

  return strategy.execute(
    txData,
    executionConfig,
    networkConfig,
    onStatusChange || (() => {}),
    runtimeApiKey
  );
}

/**
 * Waits for a transaction to be confirmed on the blockchain.
 *
 * @param txHash - The hash of the transaction to wait for.
 * @param networkConfig - The network configuration.
 * @returns A promise resolving to the final status and receipt/error.
 */
export async function waitForStellarTransactionConfirmation(
  txHash: string,
  networkConfig: StellarNetworkConfig
): Promise<{
  status: 'success' | 'error';
  receipt?: unknown;
  error?: Error;
}> {
  try {
    const rpcServer = getSorobanRpcServer(networkConfig);
    const MAX_ATTEMPTS = 20; // More attempts for confirmation
    let attempts = 0;

    while (attempts++ < MAX_ATTEMPTS) {
      try {
        const txResponse = await rpcServer.getTransaction(txHash);

        switch (txResponse.status) {
          case 'SUCCESS':
            return {
              status: 'success',
              receipt: txResponse,
            };
          case 'FAILED':
            return {
              status: 'error',
              error: new Error(`Transaction failed: ${JSON.stringify(txResponse.resultXdr)}`),
            };
          case 'NOT_FOUND':
            // Continue waiting
            break;
          default:
          // Continue waiting for other statuses
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error('waitForStellarTransactionConfirmation', `Attempt ${attempts} failed:`, error);
      }
    }

    return {
      status: 'error',
      error: new Error('Transaction confirmation timeout'),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error as Error,
    };
  }
}
