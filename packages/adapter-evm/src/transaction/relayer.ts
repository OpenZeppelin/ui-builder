// This file will contain the business logic for interacting with the Relayer SDK
import { encodeFunctionData } from 'viem';

// Using the dist/src import directory until this is fixed: https://github.com/OpenZeppelin/openzeppelin-relayer-sdk/issues/100
import {
  type ApiResponseRelayerResponseData,
  Configuration,
  type EvmTransactionRequest,
  RelayersApi,
} from '@openzeppelin/relayer-sdk/dist/src';
import {
  EvmNetworkConfig,
  NetworkType,
  RelayerDetails,
  RelayerExecutionConfig,
} from '@openzeppelin/transaction-form-types';

import { WriteContractParameters } from '../types';

/**
 * Fetches and filters relayers for a specific EVM network from the OpenZeppelin Relayer service.
 * This function handles pagination to retrieve all available relayers.
 *
 * @param serviceUrl The base URL of the relayer service.
 * @param accessToken The session-based API key for authentication.
 * @param networkConfig The EVM network configuration to filter relayers by.
 * @returns A promise that resolves to an array of compatible relayer details.
 * @throws If the API call fails or returns an unsuccessful response.
 */
export async function getEvmRelayers(
  serviceUrl: string,
  accessToken: string,
  networkConfig: EvmNetworkConfig
): Promise<RelayerDetails[]> {
  const sdkConfig = new Configuration({
    basePath: serviceUrl,
    accessToken,
  });
  const relayersApi = new RelayersApi(sdkConfig);

  let allRelayers: ApiResponseRelayerResponseData[] = [];
  let currentPage = 1;
  let totalItems = 0;
  let hasMore = true;

  // TODO: Create a more robust page loading mechanism.
  // This could be a separate utility function that handles the pagination logic
  // and can be reused. It could also include features like parallel requests
  // or a more sophisticated way of determining the total number of pages.
  do {
    const { data } = await relayersApi.listRelayers(currentPage, 100); // Fetch 100 per page

    if (!data.success || !data.data) {
      throw new Error(`Failed to fetch relayers on page ${currentPage}.`);
    }

    allRelayers = [...allRelayers, ...data.data];
    totalItems = data.pagination?.total_items || 0;

    if (allRelayers.length >= totalItems) {
      hasMore = false;
    } else {
      currentPage++;
    }
  } while (hasMore);

  // Filter for EVM relayers compatible with the adapter's current network
  return allRelayers
    .filter(
      (r: ApiResponseRelayerResponseData) =>
        r.network_type === 'evm' && r.network === networkConfig.network
    )
    .map((r: ApiResponseRelayerResponseData) => ({
      relayerId: r.id,
      name: r.name,
      address: r.address,
      network: r.network,
      networkType: r.network_type as unknown as NetworkType,
      paused: r.paused,
    }));
}

/**
 * Encodes transaction data and sends it through the specified OpenZeppelin Relayer.
 *
 * @param transactionData The contract write parameters, including ABI, function name, and args.
 * @param executionConfig The relayer-specific execution configuration, including the service URL and target relayer.
 * @param runtimeApiKey The session-only API key provided by the user at the time of execution.
 * @returns A promise that resolves to an object containing the transaction hash.
 * @throws If the relayer API returns an error or fails to provide a transaction hash.
 */
export async function sendTransactionViaRelayer(
  transactionData: WriteContractParameters,
  executionConfig: RelayerExecutionConfig,
  runtimeApiKey: string
): Promise<{ txHash: string }> {
  // 1. ABI-encode the transaction data
  const data = encodeFunctionData({
    abi: transactionData.abi,
    functionName: transactionData.functionName,
    args: transactionData.args,
  });

  // 2. Construct the request for the Relayer SDK
  const relayerTxRequest: EvmTransactionRequest = {
    to: transactionData.address,
    data,
    value: Number(transactionData.value || 0), // Convert bigint to number
    gas_limit: 210000, // Using a sensible default
  };

  // 3. Instantiate SDK and send transaction
  const sdkConfig = new Configuration({
    basePath: executionConfig.serviceUrl,
    accessToken: runtimeApiKey,
  });
  const relayersApi = new RelayersApi(sdkConfig);

  const result = await relayersApi.sendTransaction(
    executionConfig.relayer.relayerId,
    relayerTxRequest
  );

  if (!result.data.success || !result.data.data?.hash) {
    throw new Error(`Relayer API failed to return a transaction hash. Error: ${result.data.error}`);
  }

  // 4. Return the transaction hash
  return { txHash: result.data.data.hash };
}
