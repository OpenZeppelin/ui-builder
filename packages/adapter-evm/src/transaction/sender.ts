import type { GetAccountReturnType } from '@wagmi/core';
import type { TransactionReceipt, WalletClient } from 'viem';

import type { ExecutionConfig } from '@openzeppelin/transaction-form-types';
import { logger } from '@openzeppelin/transaction-form-utils';

import type { WriteContractParameters } from '../types';
import type { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

const SYSTEM_LOG_TAG = 'adapter-evm-sender';

// --- Helper Functions ---

async function _ensureCorrectNetworkOrSwitch(
  walletImplementation: WagmiWalletImplementation,
  targetChainId: number
): Promise<GetAccountReturnType> {
  const initialAccountStatus = walletImplementation.getWalletConnectionStatus();
  if (!initialAccountStatus.isConnected || !initialAccountStatus.chainId) {
    logger.error(
      SYSTEM_LOG_TAG,
      'Wallet not connected or chainId unavailable before network check.'
    );
    throw new Error('Wallet not connected or chain ID is unavailable.');
  }

  if (initialAccountStatus.chainId !== targetChainId) {
    logger.info(
      SYSTEM_LOG_TAG,
      `Wallet on chain ${initialAccountStatus.chainId}, target ${targetChainId}. Switching...`
    );
    try {
      await walletImplementation.switchNetwork(targetChainId);
      const postSwitchAccountStatus = walletImplementation.getWalletConnectionStatus();
      if (postSwitchAccountStatus.chainId !== targetChainId) {
        logger.error(
          SYSTEM_LOG_TAG,
          `Failed to switch to target chain ${targetChainId}. Current: ${postSwitchAccountStatus.chainId}`
        );
        throw new Error(`Failed to switch to the required network (target: ${targetChainId}).`);
      }
      logger.info(SYSTEM_LOG_TAG, `Successfully switched to target chain ${targetChainId}.`);
      return postSwitchAccountStatus;
    } catch (error) {
      logger.error(SYSTEM_LOG_TAG, 'Network switch failed:', error);
      throw error;
    }
  }
  logger.info(SYSTEM_LOG_TAG, 'Wallet already on target chain.');
  return initialAccountStatus;
}

async function _getAuthenticatedWalletClient(
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

async function _executeEoaTransaction(
  transactionData: WriteContractParameters,
  walletClient: WalletClient,
  accountStatus: GetAccountReturnType
): Promise<{ txHash: string }> {
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

// --- Main Exported Function ---

export async function signAndBroadcastEvmTransaction(
  transactionData: WriteContractParameters,
  walletImplementation: WagmiWalletImplementation,
  targetChainId: number,
  executionConfig?: ExecutionConfig
): Promise<{ txHash: string }> {
  logger.info(SYSTEM_LOG_TAG, 'Sign & Broadcast EVM Tx:', {
    data: transactionData,
    targetChainId,
    execConfig: executionConfig,
  });

  const currentMethod = executionConfig?.method || 'eoa';

  await _ensureCorrectNetworkOrSwitch(walletImplementation, targetChainId);
  const { walletClient, accountStatus } = await _getAuthenticatedWalletClient(walletImplementation);

  switch (currentMethod) {
    case 'eoa':
      return _executeEoaTransaction(transactionData, walletClient, accountStatus);

    case 'relayer':
      logger.warn(SYSTEM_LOG_TAG, 'Relayer execution method not yet implemented.');
      throw new Error('Relayer execution method not yet implemented.');

    case 'multisig':
      logger.warn(SYSTEM_LOG_TAG, 'Multisig execution method not yet implemented.');
      throw new Error('Multisig execution method not yet implemented.');

    default:
      const exhaustiveCheck: never = currentMethod;
      logger.error(SYSTEM_LOG_TAG, `Unsupported execution method encountered: ${exhaustiveCheck}`);
      throw new Error(`Unsupported execution method: ${exhaustiveCheck}`);
  }
}

/**
 * Waits for a transaction to be confirmed on the blockchain.
 */
export async function waitForEvmTransactionConfirmation(
  txHash: string,
  walletImplementation: WagmiWalletImplementation
): Promise<{
  status: 'success' | 'error';
  receipt?: TransactionReceipt;
  error?: Error;
}> {
  logger.info(SYSTEM_LOG_TAG, `Waiting for tx: ${txHash}`);
  try {
    // Get the public client
    const resolvedPublicClient = await walletImplementation.getPublicClient();
    if (!resolvedPublicClient) {
      throw new Error('Public client not available to wait for transaction.');
    }

    // Wait for the transaction receipt
    const receipt = await resolvedPublicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    logger.info(SYSTEM_LOG_TAG, 'Received receipt:', receipt);

    // Check the status field in the receipt
    if (receipt.status === 'success') {
      return { status: 'success', receipt };
    } else {
      logger.error(SYSTEM_LOG_TAG, 'Transaction reverted:', receipt);
      return { status: 'error', receipt, error: new Error('Transaction reverted.') };
    }
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Error waiting for transaction confirmation:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
