import {
  Account,
  BASE_FEE,
  Contract,
  rpc as StellarRpc,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import type {
  ExecutionConfig,
  StellarNetworkConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/contracts-ui-builder-types';
import { logger, userRpcConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import { valueToScVal } from '../transform/input-parser';
import { getStellarWalletConnectionStatus, signTransaction } from '../wallet/connection';
import { ExecutionStrategy } from './execution-strategy';
import type { StellarTransactionData } from './formatter';

const SYSTEM_LOG_TAG = 'EoaExecutionStrategy';

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
 * Implements the ExecutionStrategy for a standard Externally Owned Account (EOA).
 * This strategy involves signing and broadcasting a transaction directly from the user's
 * connected Stellar wallet, which is the most common way of interacting with Stellar/Soroban contracts.
 */
export class EoaExecutionStrategy implements ExecutionStrategy {
  public async execute(
    transactionData: StellarTransactionData,
    executionConfig: ExecutionConfig,
    networkConfig: StellarNetworkConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    // runtimeApiKey is unused in EOA strategy but required by the interface
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    logger.info(SYSTEM_LOG_TAG, 'Using Stellar EOA execution strategy');

    // Validate execution config is for EOA
    if (executionConfig.method !== 'eoa') {
      throw new Error(`Expected EOA execution config, got: ${executionConfig.method}`);
    }

    return this.executeEoaTransaction(transactionData, networkConfig, onStatusChange);
  }

  private async executeEoaTransaction(
    txData: StellarTransactionData,
    stellarConfig: StellarNetworkConfig,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void
  ): Promise<{ txHash: string }> {
    try {
      onStatusChange('preparing', {});

      // --- Step 1: Get RPC Server and Connected Wallet Address --- //
      const rpcServer = getSorobanRpcServer(stellarConfig);
      const connectedAddress = this.getConnectedWalletAddress();

      logger.info(SYSTEM_LOG_TAG, `Connected address: ${connectedAddress}`);

      onStatusChange('building', {});

      // --- Step 2: Get Account Details --- //
      let sourceAccount: Account;
      try {
        const accountResponse = await rpcServer.getAccount(connectedAddress);
        sourceAccount = new Account(connectedAddress, accountResponse.sequenceNumber());
      } catch (error) {
        throw new Error(`Failed to load account details: ${(error as Error).message}`);
      }

      // --- Step 3: Build Transaction --- //
      const contract = new Contract(txData.contractAddress);

      const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: stellarConfig.networkPassphrase,
      });

      // Add the contract call operation (convert args to ScVal with comprehensive type support)
      const scValArgs = txData.args.map((arg, index) => {
        const argType = txData.argTypes[index];
        return valueToScVal(arg, argType);
      });

      transactionBuilder.addOperation(contract.call(txData.functionName, ...scValArgs));

      // Set timeout (default 30 seconds)
      transactionBuilder.setTimeout(30);

      let transaction = transactionBuilder.build();

      // --- Step 4: Simulate Transaction First --- //
      onStatusChange('simulating', {});

      try {
        const simulation = await rpcServer.simulateTransaction(transaction);

        if (StellarRpc.Api.isSimulationError(simulation)) {
          throw new Error(`Transaction simulation failed: ${simulation.error}`);
        }

        // Prepare the transaction with simulation results
        transaction = await rpcServer.prepareTransaction(transaction);
      } catch (error) {
        throw new Error(`Transaction simulation/preparation failed: ${(error as Error).message}`);
      }

      onStatusChange('signing', {});

      // --- Step 5: Sign Transaction --- //
      try {
        const signResult = await signTransaction(transaction.toXDR(), connectedAddress);
        const signedTx = TransactionBuilder.fromXDR(
          signResult.signedTxXdr,
          stellarConfig.networkPassphrase
        );

        // Type guard to ensure we have a regular Transaction, not a FeeBumpTransaction
        if ('memo' in signedTx && 'sequence' in signedTx) {
          transaction = signedTx;
        } else {
          throw new Error('Unexpected transaction type returned from signing');
        }
      } catch (error) {
        if ((error as Error).message.includes('User declined')) {
          throw new Error('Transaction was rejected by user');
        }
        throw new Error(`Failed to sign transaction: ${(error as Error).message}`);
      }

      onStatusChange('broadcasting', {});

      // --- Step 6: Send Transaction --- //
      let sendResult: StellarRpc.Api.SendTransactionResponse;
      try {
        sendResult = await rpcServer.sendTransaction(transaction);
      } catch (error) {
        throw new Error(`Failed to broadcast transaction: ${(error as Error).message}`);
      }

      if (sendResult.status !== 'PENDING') {
        throw new Error(`Transaction failed to submit: ${sendResult.status}`);
      }

      const txHash = sendResult.hash;
      logger.info(SYSTEM_LOG_TAG, `Transaction submitted successfully: ${txHash}`);

      onStatusChange('confirming', {
        txHash,
      });

      // --- Step 7: Wait for Confirmation --- //
      try {
        let txResponse;
        const MAX_ATTEMPTS = 10;
        let attempts = 0;

        while (attempts++ < MAX_ATTEMPTS && txResponse?.status !== 'SUCCESS') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          txResponse = await rpcServer.getTransaction(txHash);

          switch (txResponse.status) {
            case 'FAILED':
              throw new Error(`Transaction failed: ${JSON.stringify(txResponse.resultXdr)}`);
            case 'NOT_FOUND':
              continue;
            case 'SUCCESS':
              break;
            default:
            // Continue waiting
          }
        }

        if (attempts >= MAX_ATTEMPTS || txResponse?.status !== 'SUCCESS') {
          logger.warn(SYSTEM_LOG_TAG, `Transaction confirmation timeout for ${txHash}`);
          // Don't throw error, just return the hash - transaction might still succeed
        }
      } catch (confirmError) {
        // Log the error but don't fail the transaction - it was already submitted
        logger.error(SYSTEM_LOG_TAG, 'Error waiting for confirmation:', confirmError);
      }

      onStatusChange('confirmed', {
        txHash,
      });

      return { txHash };
    } catch (error) {
      const errorMessage = `Failed to execute Stellar EOA transaction: ${(error as Error).message}`;
      logger.error(SYSTEM_LOG_TAG, errorMessage, error);

      onStatusChange('error', {});

      throw new Error(errorMessage);
    }
  }

  private getConnectedWalletAddress(): string {
    const connectionStatus = getStellarWalletConnectionStatus();

    if (!connectionStatus.isConnected || !connectionStatus.address) {
      throw new Error('No connected wallet found. Please connect your Stellar wallet first.');
    }

    return connectionStatus.address;
  }
}
