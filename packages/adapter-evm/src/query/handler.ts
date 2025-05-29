import { type Chain, type PublicClient, createPublicClient, http, isAddress } from 'viem';

import type {
  ContractSchema,
  EvmNetworkConfig,
  FunctionParameter,
} from '@openzeppelin/transaction-form-types';

import { createAbiFunctionItem } from '../abi';
import { resolveRpcUrl } from '../configuration';
import { parseEvmInput } from '../transform';
import type { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

import { isEvmViewFunction } from './view-checker';

/**
 * Private helper to get a PublicClient instance for view queries.
 * Prioritizes connected wallet client if on the correct chain.
 * Otherwise, creates a dedicated client using the resolved RPC URL for the target network.
 */
async function getPublicClientForQuery(
  walletImplementation: WagmiWalletImplementation,
  networkConfig: EvmNetworkConfig
): Promise<PublicClient> {
  const accountStatus = walletImplementation.getWalletConnectionStatus();
  const walletChainId = accountStatus.chainId ? Number(accountStatus.chainId) : undefined;
  const isConnectedToCorrectChain =
    accountStatus.isConnected && walletChainId === networkConfig.chainId;

  if (isConnectedToCorrectChain) {
    const clientFromWallet = await walletImplementation.getPublicClient();
    if (clientFromWallet) {
      console.log(
        `Using connected wallet's public client (Chain ID: ${walletChainId}) for query on ${networkConfig.name}.`
      );
      return clientFromWallet;
    } else {
      console.warn(
        `Could not get public client from connected wallet for chain ${walletChainId}. Falling back.`
      );
    }
  }

  // Fallback: Create a dedicated client using the resolved RPC URL
  const resolvedRpc = resolveRpcUrl(networkConfig);
  console.log(
    `Wallet not connected/on wrong chain OR failed to get wallet client. Creating dedicated public client for query on ${networkConfig.name} using RPC: ${resolvedRpc}`
  );

  let chainForViem: Chain;
  if (networkConfig.viemChain) {
    chainForViem = networkConfig.viemChain;
  } else {
    console.warn(
      `Viem chain object (viemChain) not provided in EvmNetworkConfig for ${networkConfig.name} (query). Creating a minimal one.`
    );
    if (!networkConfig.rpcUrl) {
      // Used for minimal object
      throw new Error(
        `RPC URL is missing in networkConfig for ${networkConfig.name} and viemChain is not set for query client.`
      );
    }
    chainForViem = {
      id: networkConfig.chainId,
      name: networkConfig.name,
      nativeCurrency: networkConfig.nativeCurrency,
      rpcUrls: {
        default: { http: [networkConfig.rpcUrl] },
        public: { http: [networkConfig.rpcUrl] },
      },
      blockExplorers: networkConfig.explorerUrl
        ? { default: { name: `${networkConfig.name} Explorer`, url: networkConfig.explorerUrl } }
        : undefined,
    };
  }

  try {
    const publicClient = createPublicClient({
      chain: chainForViem,
      transport: http(resolvedRpc),
    });
    return publicClient;
  } catch (error) {
    console.error('Failed to create network-specific public client for query:', error);
    throw new Error(
      `Failed to create network-specific public client for query: ${(error as Error).message}`
    );
  }
}

/**
 * Core logic for querying an EVM view function.
 *
 * @param contractAddress Address of the contract.
 * @param functionId ID of the function to query.
 * @param networkConfig The specific network configuration.
 * @param params Raw parameters for the function call.
 * @param contractSchema Optional pre-loaded contract schema.
 * @param walletImplementation Wallet implementation instance.
 * @param loadContractFn Function reference to load contract schema if not provided.
 * @returns The decoded result of the view function call.
 */
export async function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  networkConfig: EvmNetworkConfig,
  params: unknown[],
  contractSchema: ContractSchema | undefined,
  walletImplementation: WagmiWalletImplementation,
  loadContractFn: (source: string) => Promise<ContractSchema>
): Promise<unknown> {
  console.log(
    `Querying view function: ${functionId} on ${contractAddress} (${networkConfig.name})`,
    {
      params,
    }
  );
  try {
    // --- Validate Address --- //
    if (!contractAddress || !isAddress(contractAddress)) {
      throw new Error(`Invalid contract address provided: ${contractAddress}`);
    }

    // --- Get Public Client --- //
    const publicClient = await getPublicClientForQuery(walletImplementation, networkConfig);

    // --- Get Schema & Function Details --- //
    // loadContractFn (bound to adapter instance) uses internal networkConfig
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
    const errorMessage = `Failed to query view function ${functionId} on network ${networkConfig.name}: ${(error as Error).message}`;
    console.error(`queryEvmViewFunction Error: ${errorMessage}`, {
      contractAddress,
      functionId,
      params,
      networkConfig,
      error,
    });
    throw new Error(errorMessage);
  }
}
