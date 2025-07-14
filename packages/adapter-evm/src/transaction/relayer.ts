// This file will contain the business logic for interacting with the Relayer SDK
import { encodeFunctionData, formatEther } from 'viem';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';
import {
  type ApiResponseRelayerResponseData,
  Configuration,
  type EvmTransactionRequest,
  type EvmTransactionResponse,
  RelayersApi,
  Speed,
} from '@openzeppelin/relayer-sdk';
import {
  EvmNetworkConfig,
  ExecutionConfig,
  RelayerDetails,
  RelayerDetailsRich,
  RelayerExecutionConfig,
  TransactionStatusUpdate,
} from '@openzeppelin/transaction-form-types';

import { WriteContractParameters } from '../types';
import { WagmiWalletImplementation } from '../wallet/implementation/wagmi-implementation';

import { ExecutionStrategy } from './execution-strategy';

/**
 * EVM-specific transaction options for the OpenZeppelin Relayer.
 * These options map directly to the EvmTransactionRequest parameters in the SDK.
 */
export interface EvmRelayerTransactionOptions {
  // Basic options that most users will want to configure
  speed?: Speed;
  gasLimit?: number;

  // Advanced options for fine-grained control
  gasPrice?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;

  // Transaction expiration
  validUntil?: string; // ISO 8601 date string
}

/**
 * Implements the ExecutionStrategy for the OpenZeppelin Relayer.
 * This strategy sends the transaction to the relayer service, which then handles
 * gas payment, signing, and broadcasting. It includes a polling mechanism to wait
 * for the transaction to be mined and return the final hash.
 */
export class RelayerExecutionStrategy implements ExecutionStrategy {
  public async execute(
    transactionData: WriteContractParameters,
    executionConfig: ExecutionConfig,
    _walletImplementation: WagmiWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    const relayerConfig = executionConfig as RelayerExecutionConfig;

    if (!runtimeApiKey) {
      throw new Error('API Key is required for Relayer execution.');
    }

    const { transactionId } = await this.sendTransactionViaRelayer(
      transactionData,
      relayerConfig,
      runtimeApiKey
    );

    onStatusChange('pendingRelayer', { transactionId });

    const sdkConfig = new Configuration({
      basePath: relayerConfig.serviceUrl,
      accessToken: runtimeApiKey,
    });

    const txHash = await this.pollForTransactionHash(
      relayerConfig.relayer.relayerId,
      transactionId,
      sdkConfig
    );

    return { txHash };
  }

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
  public async getEvmRelayers(
    serviceUrl: string,
    accessToken: string,
    networkConfig: EvmNetworkConfig
  ): Promise<RelayerDetails[]> {
    logger.info('[Relayer] Getting relayers with access token', accessToken);
    const sdkConfig = new Configuration({
      basePath: serviceUrl,
      accessToken,
    });
    const relayersApi = new RelayersApi(sdkConfig);

    let allRelayers: ApiResponseRelayerResponseData[] = [];
    let currentPage = 1;
    let totalItems = 0;
    let hasMore = true;

    do {
      const { data } = await relayersApi.listRelayers(currentPage, 100);

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

    return allRelayers
      .filter(
        (r: ApiResponseRelayerResponseData) =>
          r.network_type === 'evm' && networkConfig.id.includes(r.network)
      )
      .map((r: ApiResponseRelayerResponseData) => ({
        relayerId: r.id,
        name: r.name,
        address: r.address,
        network: r.network,
        paused: r.paused,
      }));
  }

  /**
   * Fetches comprehensive information about a specific relayer including balance and status.
   * This function combines multiple SDK API calls to provide rich relayer details.
   *
   * @param serviceUrl The base URL of the relayer service.
   * @param accessToken The session-based API key for authentication.
   * @param relayerId The unique identifier of the relayer.
   * @param networkConfig The EVM network configuration to get the native currency symbol.
   * @returns A promise that resolves to enhanced relayer details including balance and status.
   * @throws If any API call fails or returns an unsuccessful response.
   */
  public async getEvmRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string,
    networkConfig: EvmNetworkConfig
  ): Promise<RelayerDetailsRich> {
    logger.info('[Relayer] Getting detailed relayer info', relayerId);

    const sdkConfig = new Configuration({
      basePath: serviceUrl,
      accessToken,
    });
    const relayersApi = new RelayersApi(sdkConfig);

    try {
      // Fetch basic relayer details, balance, and status in parallel
      const [relayerResponse, balanceResponse, statusResponse] = await Promise.all([
        relayersApi.getRelayer(relayerId),
        relayersApi.getRelayerBalance(relayerId).catch((err) => {
          logger.warn('[Relayer] Failed to fetch balance', err);
          return null;
        }),
        relayersApi.getRelayerStatus(relayerId).catch((err) => {
          logger.warn('[Relayer] Failed to fetch status', err);
          return null;
        }),
      ]);

      if (!relayerResponse.data.success || !relayerResponse.data.data) {
        throw new Error(`Failed to fetch relayer details for ID: ${relayerId}`);
      }

      const relayerData = relayerResponse.data.data;

      // Build enhanced relayer details object
      const enhancedDetails: RelayerDetailsRich = {
        relayerId: relayerData.id,
        name: relayerData.name,
        address: relayerData.address,
        network: relayerData.network,
        paused: relayerData.paused,
        systemDisabled: relayerData.system_disabled,
      };

      // Add balance if available
      if (balanceResponse?.data?.success && balanceResponse.data.data?.balance) {
        try {
          // Format balance from wei to native currency
          const balanceInWei = BigInt(balanceResponse.data.data.balance);
          const balanceInEth = formatEther(balanceInWei);
          const currencySymbol = networkConfig.nativeCurrency.symbol;
          enhancedDetails.balance = `${balanceInEth} ${currencySymbol}`;
        } catch (error) {
          logger.warn('[Relayer] Failed to format balance, using raw value', String(error));
          enhancedDetails.balance = String(balanceResponse.data.data.balance);
        }
      }

      // Add status details if available
      if (statusResponse?.data?.success && statusResponse.data.data) {
        const statusData = statusResponse.data.data;
        if (statusData.network_type === 'evm') {
          if (statusData.nonce !== undefined && statusData.nonce !== null) {
            enhancedDetails.nonce = String(statusData.nonce);
          }
          if (statusData.pending_transactions_count !== undefined) {
            enhancedDetails.pendingTransactionsCount = statusData.pending_transactions_count;
          }
          if (statusData.last_confirmed_transaction_timestamp) {
            enhancedDetails.lastConfirmedTransactionTimestamp =
              statusData.last_confirmed_transaction_timestamp;
          }
        }
      }

      logger.info('[Relayer] Retrieved enhanced relayer details', JSON.stringify(enhancedDetails));
      return enhancedDetails;
    } catch (error) {
      logger.error(
        '[Relayer] Failed to get relayer details',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Submits a transaction to the relayer service for asynchronous processing.
   * @param transactionData The contract write parameters.
   * @param executionConfig The relayer-specific execution configuration.
   * @param runtimeApiKey The user's session-only API key.
   * @returns A promise that resolves to an object containing the transaction ID assigned by the relayer.
   */
  private async sendTransactionViaRelayer(
    transactionData: WriteContractParameters,
    executionConfig: RelayerExecutionConfig,
    runtimeApiKey: string
  ): Promise<{ transactionId: string }> {
    const data = encodeFunctionData({
      abi: transactionData.abi,
      functionName: transactionData.functionName,
      args: transactionData.args,
    });

    // Type-safe extraction of EVM-specific options
    const evmOptions = executionConfig.transactionOptions as
      | EvmRelayerTransactionOptions
      | undefined;

    const relayerTxRequest: EvmTransactionRequest = {
      to: transactionData.address,
      data,
      value: Number(transactionData.value || 0),
      gas_limit: evmOptions?.gasLimit ?? 210000, // SDK requires gas_limit, so we must provide a default
      // Note: The OpenZeppelin Relayer API requires exactly one gas pricing strategy to be provided.
      // Valid options are: speed, gas_price, or both max_fee_per_gas + max_priority_fee_per_gas.
      // If none are provided, the API will return a 400 Bad Request error.
      // Only include speed if explicitly set in options
      ...(evmOptions?.speed !== undefined && { speed: evmOptions.speed }),
      // Include optional parameters only if provided
      ...(evmOptions?.gasPrice !== undefined && { gas_price: evmOptions.gasPrice }),
      ...(evmOptions?.maxFeePerGas !== undefined && { max_fee_per_gas: evmOptions.maxFeePerGas }),
      ...(evmOptions?.maxPriorityFeePerGas !== undefined && {
        max_priority_fee_per_gas: evmOptions.maxPriorityFeePerGas,
      }),
      ...(evmOptions?.validUntil !== undefined && { valid_until: evmOptions.validUntil }),
    };

    const sdkConfig = new Configuration({
      basePath: executionConfig.serviceUrl,
      accessToken: runtimeApiKey,
    });
    const relayersApi = new RelayersApi(sdkConfig);

    const result = await relayersApi.sendTransaction(
      executionConfig.relayer.relayerId,
      relayerTxRequest
    );

    if (!result.data.success || !result.data.data?.id) {
      throw new Error(`Relayer API failed to return a transaction ID. Error: ${result.data.error}`);
    }

    return { transactionId: result.data.data.id };
  }

  /**
   * Polls the relayer for a transaction's status until it is mined and has a hash, or fails.
   * @param relayerId The ID of the relayer processing the transaction.
   * @param transactionId The ID of the transaction to poll.
   * @param sdkConfig The SDK configuration containing the necessary authentication.
   * @returns A promise that resolves to the final transaction hash.
   * @throws If the transaction fails or polling times out.
   */
  private async pollForTransactionHash(
    relayerId: string,
    transactionId: string,
    sdkConfig: Configuration
  ): Promise<string> {
    const relayersApi = new RelayersApi(sdkConfig);
    const POLLING_INTERVAL = 2000;
    const POLLING_TIMEOUT = 300000; // 5 minutes in milliseconds
    const startTime = Date.now();

    while (Date.now() - startTime < POLLING_TIMEOUT) {
      const { data } = await relayersApi.getTransactionById(relayerId, transactionId);

      if (!data.success || !data.data) {
        throw new Error(`Failed to get transaction status for ID: ${transactionId}`);
      }

      const txResponse = data.data as EvmTransactionResponse;

      if (txResponse.status === 'mined' || txResponse.status === 'confirmed') {
        if (!txResponse.hash) {
          throw new Error(
            `Transaction is confirmed but no hash was returned for ID: ${transactionId}`
          );
        }
        return txResponse.hash;
      }

      if (
        txResponse.status === 'failed' ||
        txResponse.status === 'canceled' ||
        txResponse.status === 'expired'
      ) {
        throw new Error(
          `Transaction ${txResponse.status}: ${txResponse.status_reason || 'No reason provided.'}`
        );
      }

      // Continue polling for 'pending' or 'sent' statuses
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }

    throw new Error(`Polling for transaction hash timed out for ID: ${transactionId}`);
  }
}
