import {
  Account,
  BASE_FEE,
  Contract,
  rpc as StellarRpc,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

import {
  Configuration,
  RelayersApi,
  type ApiResponseRelayerResponseData,
  type ApiResponseRelayerStatusDataOneOf1,
  type ScVal,
  type StellarTransactionRequest,
  type StellarTransactionResponse,
} from '@openzeppelin/relayer-sdk';
import type {
  ExecutionConfig,
  RelayerDetails,
  RelayerDetailsRich,
  RelayerExecutionConfig,
  StellarNetworkConfig,
  TransactionStatusUpdate,
  TxStatus,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { CALLER_PLACEHOLDER } from '../access-control/actions';
import { valueToScVal } from '../transform/input-parser';
import { getStellarWalletConnectionStatus, signTransaction } from '../wallet/connection';
import { ExecutionStrategy } from './execution-strategy';
import type { StellarTransactionData } from './formatter';

/**
 * Stellar-specific transaction options for the OpenZeppelin Relayer.
 * These options map directly to the StellarTransactionRequest parameters in the SDK.
 */
export interface StellarRelayerTransactionOptions {
  // Basic options
  maxFee?: number;

  // Transaction expiration
  validUntil?: string; // ISO 8601 date string

  // Fee bump for stuck transactions
  feeBump?: boolean;
}

/**
 * Implements the ExecutionStrategy for the OpenZeppelin Relayer for Stellar networks.
 * This strategy sends the transaction to the relayer service, which then handles
 * fee payment, signing, and broadcasting on Stellar/Soroban. It includes a polling
 * mechanism to wait for the transaction to be confirmed and return the final hash.
 */
export class RelayerExecutionStrategy implements ExecutionStrategy {
  public async execute(
    transactionData: StellarTransactionData,
    executionConfig: ExecutionConfig,
    networkConfig: StellarNetworkConfig,
    onStatusChange: (status: TxStatus, details: TransactionStatusUpdate) => void,
    runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    const relayerConfig = executionConfig as RelayerExecutionConfig;

    if (!runtimeApiKey) {
      throw new Error('API Key is required for Relayer execution.');
    }

    const { transactionId } = await this.sendTransactionViaRelayer(
      transactionData,
      relayerConfig,
      networkConfig,
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
   * Fetches and filters relayers for Stellar networks from the OpenZeppelin Relayer service.
   * This function handles pagination to retrieve all available relayers.
   *
   * @param serviceUrl The base URL of the relayer service.
   * @param accessToken The session-based API key for authentication.
   * @param networkConfig The Stellar network configuration to filter relayers by.
   * @returns A promise that resolves to an array of compatible relayer details.
   * @throws If the API call fails or returns an unsuccessful response.
   */
  public async getStellarRelayers(
    serviceUrl: string,
    accessToken: string,
    networkConfig: StellarNetworkConfig
  ): Promise<RelayerDetails[]> {
    logger.info(
      '[StellarRelayer] Getting relayers with access token',
      accessToken.slice(0, 5).padEnd(accessToken.length, '*')
    );
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
          r.network_type === 'stellar' && networkConfig.id.includes(r.network)
      )
      .map((r: ApiResponseRelayerResponseData) => ({
        relayerId: r.id,
        name: r.name,
        address: r.address || '',
        network: r.network,
        paused: r.paused || false,
      }));
  }

  /**
   * Fetches comprehensive information about a specific Stellar relayer including balance and status.
   * This function combines multiple SDK API calls to provide rich relayer details.
   *
   * @param serviceUrl The base URL of the relayer service.
   * @param accessToken The session-based API key for authentication.
   * @param relayerId The unique identifier of the relayer.
   * @param networkConfig The Stellar network configuration for context.
   * @returns A promise that resolves to enhanced relayer details including balance and status.
   * @throws If any API call fails or returns an unsuccessful response.
   */
  public async getStellarRelayer(
    serviceUrl: string,
    accessToken: string,
    relayerId: string,
    _networkConfig: StellarNetworkConfig
  ): Promise<RelayerDetailsRich> {
    logger.info('[StellarRelayer] Getting detailed relayer info', relayerId);

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
          logger.warn('[StellarRelayer] Failed to fetch balance', err);
          return null;
        }),
        relayersApi.getRelayerStatus(relayerId).catch((err) => {
          logger.warn('[StellarRelayer] Failed to fetch status', err);
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
        address: relayerData.address || '',
        network: relayerData.network,
        paused: relayerData.paused || false,
        systemDisabled: relayerData.system_disabled || false,
      };

      // Add balance if available (Stellar native balance in lumens)
      if (balanceResponse?.data?.success && balanceResponse.data.data?.balance) {
        try {
          // Stellar balance is in stroops (1 XLM = 10,000,000 stroops)
          const balanceInStroops = Number(balanceResponse.data.data.balance);
          const balanceInXlm = balanceInStroops / 10000000;
          enhancedDetails.balance = `${balanceInXlm.toFixed(7)} XLM`;
        } catch (error) {
          logger.warn('[StellarRelayer] Failed to format balance, using raw value', String(error));
          enhancedDetails.balance = String(balanceResponse.data.data.balance);
        }
      }

      // Add status details if available
      if (statusResponse?.data?.success && statusResponse.data.data) {
        const statusData = statusResponse.data.data;
        if (statusData.network_type === 'stellar') {
          // Type guard to ensure we have Stellar-specific fields
          const stellarStatusData = statusData as ApiResponseRelayerStatusDataOneOf1;
          if (
            stellarStatusData.sequence_number !== undefined &&
            stellarStatusData.sequence_number !== null
          ) {
            enhancedDetails.nonce = String(stellarStatusData.sequence_number);
          }
          if (stellarStatusData.pending_transactions_count !== undefined) {
            enhancedDetails.pendingTransactionsCount = stellarStatusData.pending_transactions_count;
          }
          if (stellarStatusData.last_confirmed_transaction_timestamp) {
            enhancedDetails.lastConfirmedTransactionTimestamp =
              stellarStatusData.last_confirmed_transaction_timestamp;
          }
        }
      }

      logger.info(
        '[StellarRelayer] Retrieved enhanced relayer details',
        JSON.stringify(enhancedDetails)
      );
      return enhancedDetails;
    } catch (error) {
      logger.error(
        '[StellarRelayer] Failed to get relayer details',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Submits a Stellar transaction to the relayer service for asynchronous processing.
   * @param transactionData The Stellar contract transaction data.
   * @param executionConfig The relayer-specific execution configuration.
   * @param networkConfig The Stellar network configuration.
   * @param runtimeApiKey The user's session-only API key.
   * @returns A promise that resolves to an object containing the transaction ID assigned by the relayer.
   */
  private async sendTransactionViaRelayer(
    transactionData: StellarTransactionData,
    executionConfig: RelayerExecutionConfig,
    _networkConfig: StellarNetworkConfig,
    runtimeApiKey: string
  ): Promise<{ transactionId: string }> {
    // Type-safe extraction of Stellar-specific options
    const stellarOptions = executionConfig.transactionOptions as
      | StellarRelayerTransactionOptions
      | undefined;

    // If fee bump is requested, use signed XDR mode per relayer docs
    // Only valid when providing a signed transaction_xdr
    let relayerTxRequest: StellarTransactionRequest;
    if (stellarOptions?.feeBump) {
      const signedInnerXdr = await this.buildSignedInnerTransactionXdr(
        transactionData,
        _networkConfig,
        stellarOptions
      );

      relayerTxRequest = {
        network: executionConfig.relayer.network,
        transaction_xdr: signedInnerXdr,
        fee_bump: true,
        ...(stellarOptions?.maxFee !== undefined && { max_fee: stellarOptions.maxFee }),
        ...(stellarOptions?.validUntil !== undefined && { valid_until: stellarOptions.validUntil }),
      };
    } else {
      // Default operations-based mode
      relayerTxRequest = {
        network: executionConfig.relayer.network, // Use relayer's network (e.g., 'testnet', 'mainnet')
        source_account: executionConfig.relayer.address, // Use relayer's address as source account
        operations: [
          {
            type: 'invoke_contract',
            contract_address: transactionData.contractAddress,
            function_name: transactionData.functionName,
            args: this.convertArgsToScVal(transactionData),
            // No auth field needed - using source_account at top level
          },
        ],
        // Include optional parameters if provided
        ...(stellarOptions?.maxFee !== undefined && { max_fee: stellarOptions.maxFee }),
        ...(stellarOptions?.validUntil !== undefined && { valid_until: stellarOptions.validUntil }),
        // Note: fee_bump is not supported by the relayer service in operations mode
        // Memos are not supported for Soroban contract operations
      };
    }

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
   * Converts Stellar transaction arguments to ScVal format for the relayer.
   * Uses the same comprehensive conversion utility as the EOA execution strategy.
   */
  private convertArgsToScVal(transactionData: StellarTransactionData): ScVal[] {
    // Use the same comprehensive conversion as EOA execution strategy
    return transactionData.args.map((arg, index) => {
      const argType = transactionData.argTypes[index];
      const argSchema = transactionData.argSchema?.[index]; // Pass schema for struct field type resolution

      const scVal = valueToScVal(arg, argType, argSchema);

      // Convert Stellar SDK ScVal to relayer SDK ScVal format
      return this.stellarScValToRelayerScVal(scVal);
    });
  }

  /**
   * Build and sign the inner transaction using the connected wallet.
   * Returns the signed inner transaction XDR to be wrapped by the relayer as a fee bump.
   */
  private async buildSignedInnerTransactionXdr(
    txData: StellarTransactionData,
    stellarConfig: StellarNetworkConfig,
    _options?: StellarRelayerTransactionOptions
  ): Promise<string> {
    const rpcServer = this.getSorobanRpcServer(stellarConfig);
    const connectedAddress = this.getConnectedWalletAddress();

    // Fetch sequence for the connected address
    const accountResponse = await rpcServer.getAccount(connectedAddress);
    const sourceAccount = new Account(connectedAddress, accountResponse.sequenceNumber());

    // Build a contract invocation transaction
    const contract = new Contract(txData.contractAddress);
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: stellarConfig.networkPassphrase,
    });

    // Replace CALLER_PLACEHOLDER with the connected wallet address
    // This supports OpenZeppelin Stellar access control functions that require a caller parameter
    const resolvedArgs = txData.args.map((arg) =>
      arg === CALLER_PLACEHOLDER ? connectedAddress : arg
    );

    const scValArgs = resolvedArgs.map((arg, index) => {
      const argType = txData.argTypes[index];
      const argSchema = txData.argSchema?.[index];
      return valueToScVal(arg, argType, argSchema);
    });

    transactionBuilder.addOperation(contract.call(txData.functionName, ...scValArgs));

    // Note: Soroban contract transactions do not support memos; do not attach

    // Timeout: keep short; relayer will wrap in fee bump and submit
    transactionBuilder.setTimeout(30);

    // Build → simulate → prepare
    let transaction = transactionBuilder.build();

    const simulation = await rpcServer.simulateTransaction(transaction);
    if (StellarRpc.Api.isSimulationError(simulation)) {
      throw new Error(`Transaction simulation failed: ${simulation.error}`);
    }
    transaction = await rpcServer.prepareTransaction(transaction);

    // Sign with connected wallet
    const signResult = await signTransaction(transaction.toXDR(), connectedAddress);
    const signedTx = TransactionBuilder.fromXDR(
      signResult.signedTxXdr,
      stellarConfig.networkPassphrase
    );

    // Ensure we have a standard Transaction (not FeeBumpTransaction)
    if ('memo' in signedTx && 'sequence' in signedTx) {
      return signedTx.toXDR();
    }
    throw new Error('Unexpected transaction type returned from signing');
  }

  /**
   * Get Soroban RPC Server instance with current configuration and user overrides.
   */
  private getSorobanRpcServer(networkConfig: StellarNetworkConfig): StellarRpc.Server {
    // Allow HTTP for localhost development
    const rpcUrl = networkConfig.sorobanRpcUrl;
    if (!rpcUrl) {
      throw new Error(`No Soroban RPC URL available for network ${networkConfig.name}`);
    }
    const allowHttp = new URL(rpcUrl).hostname === 'localhost';
    return new StellarRpc.Server(rpcUrl, { allowHttp });
  }

  private getConnectedWalletAddress(): string {
    const connectionStatus = getStellarWalletConnectionStatus();
    if (!connectionStatus.isConnected || !connectionStatus.address) {
      throw new Error('No connected wallet found. Please connect your Stellar wallet first.');
    }
    return connectionStatus.address;
  }

  /**
   * Converts a Stellar SDK ScVal to the relayer SDK ScVal format.
   * The relayer SDK uses a simplified ScVal representation compared to Stellar SDK's XDR types.
   */
  private stellarScValToRelayerScVal(stellarScVal: xdr.ScVal): ScVal {
    const scValType = stellarScVal.switch();

    switch (scValType.name) {
      case 'scvBool':
        return { bool: stellarScVal.b() };
      case 'scvVoid':
        return { bool: false }; // Fallback for void
      case 'scvU32':
        return { u32: stellarScVal.u32() };
      case 'scvI32':
        return { i32: stellarScVal.i32() };
      case 'scvU64':
        return { u64: stellarScVal.u64().toString() };
      case 'scvI64':
        return { i64: stellarScVal.i64().toString() };
      case 'scvU128': {
        const u128Parts = stellarScVal.u128();
        return {
          u128: {
            hi: u128Parts.hi().toString(),
            lo: u128Parts.lo().toString(),
          },
        };
      }
      case 'scvI128': {
        const i128Parts = stellarScVal.i128();
        return {
          i128: {
            hi: i128Parts.hi().toString(),
            lo: i128Parts.lo().toString(),
          },
        };
      }
      case 'scvU256': {
        const u256Parts = stellarScVal.u256();
        return {
          u256: {
            hi_hi: u256Parts.hiHi().toString(),
            hi_lo: u256Parts.hiLo().toString(),
            lo_hi: u256Parts.loHi().toString(),
            lo_lo: u256Parts.loLo().toString(),
          },
        };
      }
      case 'scvI256': {
        const i256Parts = stellarScVal.i256();
        return {
          i256: {
            hi_hi: i256Parts.hiHi().toString(),
            hi_lo: i256Parts.hiLo().toString(),
            lo_hi: i256Parts.loHi().toString(),
            lo_lo: i256Parts.loLo().toString(),
          },
        };
      }
      case 'scvBytes':
        return { bytes: stellarScVal.bytes().toString('hex') };
      case 'scvString':
        return { string: stellarScVal.str().toString() };
      case 'scvSymbol':
        return { symbol: stellarScVal.sym().toString() };
      case 'scvVec':
        return {
          vec: stellarScVal.vec()?.map((val) => this.stellarScValToRelayerScVal(val)) || [],
        };
      case 'scvMap': {
        const mapEntries = stellarScVal.map() || [];
        return {
          map: mapEntries.map((entry) => ({
            key: this.stellarScValToRelayerScVal(entry.key()),
            val: this.stellarScValToRelayerScVal(entry.val()),
          })),
        };
      }
      case 'scvAddress':
        return { address: stellarScVal.address().toString() };
      default:
        // For any unhandled types, convert to string representation as fallback
        return { string: stellarScVal.toString() };
    }
  }

  /**
   * Polls the relayer for a Stellar transaction's status until it is confirmed and has a hash, or fails.
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

      const txResponse = data.data as StellarTransactionResponse;

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
        throw new Error(`Transaction ${txResponse.status}`);
      }

      // Continue polling for 'pending' or 'sent' statuses
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }

    throw new Error(`Polling for transaction hash timed out for ID: ${transactionId}`);
  }
}
