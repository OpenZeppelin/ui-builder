import type { TransactionReceipt } from 'viem';

import type { WriteContractParameters } from '../types';
import type { WagmiWalletImplementation } from '../wallet/wagmi-implementation';

/**
 * Signs and broadcasts a transaction using the connected wallet.
 */
export async function signAndBroadcastEvmTransaction(
  transactionData: WriteContractParameters,
  walletImplementation: WagmiWalletImplementation
): Promise<{ txHash: string }> {
  console.log('Attempting to sign and broadcast EVM transaction:', transactionData);

  // 1. Get the Wallet Client
  const walletClient = await walletImplementation.getWalletClient();
  if (!walletClient) {
    console.error('signAndBroadcast: Wallet client not available. Is wallet connected?');
    throw new Error('Wallet is not connected or client is unavailable.');
  }

  // 2. Get the connected account
  const accountStatus = walletImplementation.getWalletConnectionStatus();
  if (!accountStatus.isConnected || !accountStatus.address) {
    console.error('signAndBroadcast: Account not available. Is wallet connected?');
    throw new Error('Wallet is not connected or account address is unavailable.');
  }

  try {
    // 3. Call viem's writeContract
    console.log('Calling walletClient.writeContract with:', {
      account: accountStatus.address,
      address: transactionData.address,
      abi: transactionData.abi,
      functionName: transactionData.functionName,
      args: transactionData.args,
      value: transactionData.value,
      chain: walletClient.chain,
    });

    const hash = await walletClient.writeContract({
      account: accountStatus.address,
      address: transactionData.address,
      abi: transactionData.abi,
      functionName: transactionData.functionName,
      args: transactionData.args,
      value: transactionData.value,
      chain: walletClient.chain,
    });

    console.log('Transaction initiated successfully. Hash:', hash);
    return { txHash: hash };
  } catch (error: unknown) {
    console.error('Error during writeContract call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';
    throw new Error(`Transaction failed: ${errorMessage}`);
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
  console.info('waitForEvmTransactionConfirmation', `Waiting for tx: ${txHash}`);
  try {
    // Get the public client
    const publicClient = walletImplementation.getPublicClient();
    if (!publicClient) {
      throw new Error('Public client not available to wait for transaction.');
    }

    // Wait for the transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    console.info('waitForEvmTransactionConfirmation', 'Received receipt:', receipt);

    // Check the status field in the receipt
    if (receipt.status === 'success') {
      return { status: 'success', receipt };
    } else {
      console.error('waitForEvmTransactionConfirmation', 'Transaction reverted:', receipt);
      return { status: 'error', receipt, error: new Error('Transaction reverted.') };
    }
  } catch (error) {
    console.error(
      'waitForEvmTransactionConfirmation',
      'Error waiting for transaction confirmation:',
      error
    );
    return {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
