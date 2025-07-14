import { GetAccountReturnType } from '@wagmi/core';
import { WalletClient } from 'viem';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import {
  EoaExecutionConfig,
  ExecutionConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/contracts-ui-builder-types';

import { WriteContractParameters } from '../types';
import { validateEoaConfig } from '../validation';
import { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

import { ExecutionStrategy } from './execution-strategy';

const SYSTEM_LOG_TAG = 'EoaExecutionStrategy';

/**
 * Implements the ExecutionStrategy for a standard Externally Owned Account (EOA).
 * This strategy involves signing and broadcasting a transaction directly from the user's
 * connected wallet, which is the most common way of interacting with a blockchain.
 */
export class EoaExecutionStrategy implements ExecutionStrategy {
  public async execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    walletImplementation: WagmiWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    // runtimeApiKey is unused in EOA strategy but required by the interface
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    const { walletClient, accountStatus } =
      await this.getAuthenticatedWalletClient(walletImplementation);

    // Final validation at the point of execution
    const eoaConfig = executionConfig as EoaExecutionConfig;
    const validationResult = await validateEoaConfig(eoaConfig, {
      ...accountStatus,
      chainId: accountStatus.chainId?.toString(),
    });
    if (validationResult !== true) {
      throw new Error(validationResult);
    }

    logger.info(SYSTEM_LOG_TAG, 'Using EOA execution strategy.');
    try {
      logger.debug(SYSTEM_LOG_TAG, 'Calling walletClient.writeContract with:', {
        account: accountStatus.address,
        address: transactionData.address,
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
        value: transactionData.value,
        chain: walletClient.chain,
      });

      onStatusChange('pendingSignature', {});

      const hash = await walletClient.writeContract({
        account: accountStatus.address!,
        address: transactionData.address,
        abi: transactionData.abi,
        functionName: transactionData.functionName,
        args: transactionData.args,
        value: transactionData.value,
        chain: walletClient.chain,
      });

      logger.info(SYSTEM_LOG_TAG, 'EOA Transaction initiated. Hash:', hash);
      return { txHash: hash };
    } catch (error: unknown) {
      logger.error(SYSTEM_LOG_TAG, 'Error during EOA writeContract call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown EOA transaction error';
      throw new Error(`Transaction failed (EOA): ${errorMessage}`);
    }
  }

  private async getAuthenticatedWalletClient(
    walletImplementation: WagmiWalletImplementation
  ): Promise<{
    walletClient: WalletClient;
    accountStatus: GetAccountReturnType;
  }> {
    const walletClient = await walletImplementation.getWalletClient();
    if (!walletClient) {
      logger.error(SYSTEM_LOG_TAG, 'Wallet client not available. Is wallet connected?');
      throw new Error('Wallet is not connected or client is unavailable.');
    }

    const accountStatus = walletImplementation.getWalletConnectionStatus();
    if (!accountStatus.isConnected || !accountStatus.address) {
      logger.error(SYSTEM_LOG_TAG, 'Account not available. Is wallet connected?');
      throw new Error('Wallet is not connected or account address is unavailable.');
    }
    return { walletClient, accountStatus };
  }
}
