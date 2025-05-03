import { type PublicClient, createPublicClient, http, isAddress } from 'viem';
import { mainnet } from 'viem/chains';

import type {
  ContractSchema,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types/contracts';

import { createAbiFunctionItem } from '../abi';
import { parseEvmInput } from '../transform';
import type { WagmiWalletImplementation } from '../wallet-connect/wagmi-implementation';

import { isEvmViewFunction } from './view-checker';

/**
 * Private helper (within query module) to get a PublicClient instance.
 * Uses the connected wallet's client if available,
 * otherwise falls back to a default public RPC client.
 */
function getPublicClientForQuery(walletImplementation: WagmiWalletImplementation): PublicClient {
  const accountStatus = walletImplementation.getWalletConnectionStatus();
  let publicClient: PublicClient | null = null;

  if (accountStatus.isConnected && accountStatus.chainId) {
    publicClient = walletImplementation.getPublicClient();
    console.log(
      `Using connected wallet's public client (Chain ID: ${accountStatus.chainId}) for query.`
    );
  } else {
    console.log('Wallet not connected, creating default public RPC client for query.');
    const defaultRpcUrl = import.meta.env.VITE_RPC_URL || 'https://eth.llamarpc.com';
    if (!defaultRpcUrl) {
      throw new Error('Default VITE_RPC_URL is not configured for connectionless queries.');
    }
    const defaultChain = mainnet;
    try {
      publicClient = createPublicClient({
        chain: defaultChain,
        transport: http(defaultRpcUrl),
      });
    } catch (error) {
      console.error('Failed to create default public client:', error);
      throw new Error(`Failed to create default public client: ${(error as Error).message}`);
    }
  }

  if (!publicClient) {
    throw new Error('Failed to obtain Public Client for query.');
  }

  return publicClient;
}

/**
 * Core logic for querying an EVM view function.
 *
 * @param contractAddress Address of the contract.
 * @param functionId ID of the function to query.
 * @param params Raw parameters for the function call.
 * @param contractSchema Optional pre-loaded contract schema.
 * @param walletImplementation Wallet implementation to get a PublicClient instance.
 * @param loadContractFn Function reference to load contract schema if not provided.
 * @returns The decoded result of the view function call.
 */
export async function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  params: unknown[],
  contractSchema: ContractSchema | undefined,
  walletImplementation: WagmiWalletImplementation,
  loadContractFn: (source: string) => Promise<ContractSchema>
): Promise<unknown> {
  console.log(`Querying view function: ${functionId} on ${contractAddress}`, { params });
  try {
    // --- Validate Address --- //
    if (!contractAddress || !isAddress(contractAddress)) {
      throw new Error(`Invalid contract address provided: ${contractAddress}`);
    }

    // --- Get Public Client --- //
    const publicClient = getPublicClientForQuery(walletImplementation);

    // --- Get Schema & Function Details --- //
    const schema = contractSchema || (await loadContractFn(contractAddress));
    const functionDetails = schema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      throw new Error(`Function with ID ${functionId} not found in contract schema.`);
    }
    if (!isEvmViewFunction(functionDetails)) {
      throw new Error(`Function ${functionDetails.name} is not a view function.`);
    }

    // --- Parse Input Parameters --- //
    const expectedInputs: readonly FunctionParameter[] = functionDetails.inputs;
    if (params.length !== expectedInputs.length) {
      throw new Error(
        `Incorrect number of parameters provided for ${functionDetails.name}. Expected ${expectedInputs.length}, got ${params.length}.`
      );
    }
    const args = expectedInputs.map((inputParam: FunctionParameter, index: number) => {
      const rawValue = params[index];
      return parseEvmInput(inputParam, rawValue, false);
    });
    console.log('Parsed Args for readContract:', args);

    // --- Construct ABI Item --- //
    const functionAbiItem = createAbiFunctionItem(functionDetails);

    console.log(
      `[Query ${functionDetails.name}] Calling readContract with ABI:`,
      functionAbiItem,
      'Args:',
      args
    );

    // --- Call readContract --- //
    let decodedResult: unknown;
    try {
      decodedResult = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: [functionAbiItem],
        functionName: functionDetails.name,
        args: args,
      });
    } catch (readError) {
      console.error(
        `[Query ${functionDetails.name}] publicClient.readContract specific error:`,
        readError
      );
      throw new Error(
        `Viem readContract failed for ${functionDetails.name}: ${(readError as Error).message}`
      );
    }

    console.log(`[Query ${functionDetails.name}] Raw decoded result:`, decodedResult);

    return decodedResult;
  } catch (error) {
    const errorMessage = `Failed to query view function ${functionId}: ${(error as Error).message}`;
    console.error(`queryEvmViewFunction Error: ${errorMessage}`, {
      contractAddress,
      functionId,
      params,
      error,
    });
    throw new Error(errorMessage);
  }
}
