import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  rpc as StellarRpc,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import type {
  ContractSchema,
  FunctionParameter,
  NetworkConfig,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { logger, userRpcConfigService } from '@openzeppelin/ui-builder-utils';

import { parseStellarInput } from '../transform';
import { formatStellarFunctionResult } from '../transform/output-formatter';
import { convertStellarTypeToScValType } from '../utils';
import { isStellarViewFunction } from './view-checker';

/**
 * Private helper to get a Soroban RPC Server instance for view queries.
 * Prioritizes custom RPC configuration, then falls back to network default.
 */
function getSorobanRpcServer(networkConfig: StellarNetworkConfig): StellarRpc.Server {
  // Check if there's a custom RPC configuration
  const customRpcConfig = userRpcConfigService.getUserRpcConfig(networkConfig.id);
  const rpcUrl = customRpcConfig?.url || networkConfig.sorobanRpcUrl;

  if (!rpcUrl) {
    throw new Error(`No Soroban RPC URL available for network ${networkConfig.name}`);
  }

  logger.info(
    'getSorobanRpcServer',
    `Creating Soroban RPC server for ${networkConfig.name} using RPC: ${rpcUrl}`
  );

  // Allow HTTP for localhost development
  const allowHttp = new URL(rpcUrl).hostname === 'localhost';

  return new StellarRpc.Server(rpcUrl, {
    allowHttp,
  });
}

/**
 * Creates a dummy transaction to simulate a contract function call.
 * This is used for view functions that don't modify state.
 */
async function createSimulationTransaction(
  contractAddress: string,
  functionName: string,
  args: unknown[],
  paramTypes: string[],
  networkConfig: StellarNetworkConfig
): Promise<TransactionBuilder> {
  try {
    // Create a dummy source account for simulation
    // We'll use a well-known testnet account for simulation
    const dummyKeypair = Keypair.random();
    const sourceAccount = new Account(dummyKeypair.publicKey(), '0');

    // Create contract instance
    const contract = new Contract(contractAddress);

    // Convert args to ScVal with proper type hints
    const scValArgs = args.map((arg, index) => {
      const paramType = paramTypes[index];
      if (!paramType) {
        // Fallback to direct conversion if type info missing
        return nativeToScVal(arg);
      }

      // Special cases that don't need type hints
      if (paramType === 'Bool' || paramType === 'Bytes' || paramType.match(/^BytesN<\d+>$/)) {
        return nativeToScVal(arg);
      }

      // Use common utility for type conversion with hints
      const typeHint = convertStellarTypeToScValType(paramType);
      return nativeToScVal(arg, { type: typeHint });
    });

    // Build the transaction for simulation
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: networkConfig.networkPassphrase,
    })
      .addOperation(contract.call(functionName, ...scValArgs))
      .setTimeout(30);

    return transaction;
  } catch (error) {
    logger.error('createSimulationTransaction', 'Failed to create simulation transaction:', error);
    throw new Error(`Failed to create simulation transaction: ${(error as Error).message}`);
  }
}

/**
 * Determines if a Stellar contract function modifies state by simulating it
 * and checking for state changes.
 *
 * @param contractAddress Address of the contract.
 * @param functionName Name of the function to check.
 * @param networkConfig The specific network configuration.
 * @param inputTypes Parameter types for the function (empty array for parameterless functions).
 * @returns True if the function modifies state, false if it's read-only.
 */
export async function checkStellarFunctionStateMutability(
  contractAddress: string,
  functionName: string,
  networkConfig: StellarNetworkConfig,
  inputTypes: string[] = []
): Promise<boolean> {
  logger.info(
    'checkStellarFunctionStateMutability',
    `Checking state mutability for function: ${functionName} on ${contractAddress}`
  );

  try {
    // --- Validate Contract Address --- //
    try {
      Address.fromString(contractAddress);
    } catch {
      throw new Error(`Invalid Stellar contract address provided: ${contractAddress}`);
    }

    // --- Get Soroban RPC Server --- //
    const rpcServer = getSorobanRpcServer(networkConfig);

    // --- Create dummy parameters for simulation --- //
    // For state mutability detection, we can use dummy values since we only care about state changes
    const dummyArgs = inputTypes.map((paramType) => {
      // Create minimal dummy values for different types
      switch (paramType) {
        case 'Bool':
          return false;
        case 'I32':
        case 'U32':
        case 'I64':
        case 'U64':
        case 'I128':
        case 'U128':
        case 'I256':
        case 'U256':
          return 0;
        case 'String':
          return '';
        case 'Bytes':
          return Buffer.alloc(0);
        case 'Address':
          // Use the contract address as a dummy address
          return contractAddress;
        default:
          // For complex types, use null which often gets converted to appropriate defaults
          return null;
      }
    });

    // --- Create Simulation Transaction --- //
    const transactionBuilder = await createSimulationTransaction(
      contractAddress,
      functionName,
      dummyArgs,
      inputTypes,
      networkConfig
    );

    const transaction = transactionBuilder.build();

    logger.debug(
      'checkStellarFunctionStateMutability',
      `[Check ${functionName}] Simulating transaction for state mutability check`
    );

    // --- Simulate Transaction --- //
    let simulationResult: StellarRpc.Api.SimulateTransactionResponse;
    try {
      simulationResult = await rpcServer.simulateTransaction(transaction);
    } catch (simulationError) {
      logger.warn(
        'checkStellarFunctionStateMutability',
        `[Check ${functionName}] Simulation failed, assuming function modifies state:`,
        simulationError
      );
      // If simulation fails, err on the side of caution and assume it modifies state
      return true;
    }

    // --- Process Simulation Result --- //
    if (StellarRpc.Api.isSimulationError(simulationResult)) {
      logger.warn(
        'checkStellarFunctionStateMutability',
        `[Check ${functionName}] Simulation error, assuming function modifies state:`,
        simulationResult.error
      );
      // If there's a simulation error, assume it modifies state for safety
      return true;
    }

    // --- Check State Changes (following Laboratory approach) --- //
    const hasStateChanges =
      simulationResult.stateChanges && simulationResult.stateChanges.length > 0;

    logger.info(
      'checkStellarFunctionStateMutability',
      `[Check ${functionName}] State mutability check complete:`,
      {
        hasStateChanges,
        stateChangesCount: simulationResult.stateChanges?.length || 0,
        modifiesState: Boolean(hasStateChanges),
      }
    );

    return Boolean(hasStateChanges);
  } catch (error) {
    logger.warn(
      'checkStellarFunctionStateMutability',
      `Failed to check state mutability for ${functionName}, assuming it modifies state:`,
      error
    );
    // If anything goes wrong, assume the function modifies state as a safe default
    return true;
  }
}

/**
 * Core logic for querying a Stellar view function.
 *
 * @param contractAddress Address of the contract.
 * @param functionId ID of the function to query.
 * @param networkConfig The specific network configuration.
 * @param params Raw parameters for the function call.
 * @param contractSchema Optional pre-loaded contract schema.
 * @param loadContractFn Function reference to load contract schema if not provided.
 * @returns The decoded result of the view function call.
 */
export async function queryStellarViewFunction(
  contractAddress: string,
  functionId: string,
  networkConfig: NetworkConfig,
  params: unknown[] = [],
  contractSchema?: ContractSchema,
  loadContractFn?: (source: string) => Promise<ContractSchema>
): Promise<unknown> {
  logger.info(
    'queryStellarViewFunction',
    `Querying Stellar view function: ${functionId} on ${contractAddress} (${networkConfig.name})`,
    { params }
  );

  if (networkConfig.ecosystem !== 'stellar') {
    throw new Error('Invalid network configuration for Stellar query.');
  }

  const stellarConfig = networkConfig as StellarNetworkConfig;

  try {
    // --- Validate Contract Address --- //
    try {
      Address.fromString(contractAddress);
    } catch {
      throw new Error(`Invalid Stellar contract address provided: ${contractAddress}`);
    }

    // --- Get Soroban RPC Server --- //
    const rpcServer = getSorobanRpcServer(stellarConfig);

    // --- Get Schema & Function Details --- //
    let schema = contractSchema;
    if (!schema && loadContractFn) {
      schema = await loadContractFn(contractAddress);
    }
    if (!schema) {
      throw new Error(
        `Contract schema not provided and loadContractFn not available for ${contractAddress}`
      );
    }

    const functionDetails = schema.functions.find((fn) => fn.id === functionId);
    if (!functionDetails) {
      throw new Error(`Function with ID ${functionId} not found in contract schema.`);
    }

    if (!isStellarViewFunction(functionDetails)) {
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
      return parseStellarInput(rawValue, inputParam.type);
    });

    logger.debug('queryStellarViewFunction', 'Parsed Args for contract call:', args);

    // --- Create Simulation Transaction --- //
    const paramTypes = expectedInputs.map((input) => input.type);
    const transactionBuilder = await createSimulationTransaction(
      contractAddress,
      functionDetails.name,
      args,
      paramTypes,
      stellarConfig
    );

    const transaction = transactionBuilder.build();

    logger.debug(
      'queryStellarViewFunction',
      `[Query ${functionDetails.name}] Simulating transaction:`,
      transaction.toXDR()
    );

    // --- Simulate Transaction --- //
    let simulationResult: StellarRpc.Api.SimulateTransactionResponse;
    try {
      simulationResult = await rpcServer.simulateTransaction(transaction);
    } catch (simulationError) {
      logger.error(
        'queryStellarViewFunction',
        `[Query ${functionDetails.name}] Simulation failed:`,
        simulationError
      );
      throw new Error(
        `Soroban RPC simulation failed for ${functionDetails.name}: ${(simulationError as Error).message}`
      );
    }

    // --- Process Simulation Result --- //
    if (StellarRpc.Api.isSimulationError(simulationResult)) {
      logger.error(
        'queryStellarViewFunction',
        `[Query ${functionDetails.name}] Simulation error:`,
        simulationResult.error
      );
      throw new Error(`Contract simulation failed: ${simulationResult.error}`);
    }

    if (!simulationResult.result) {
      throw new Error(`No result returned from contract simulation for ${functionDetails.name}`);
    }

    const rawResult = simulationResult.result.retval;
    logger.debug(
      'queryStellarViewFunction',
      `[Query ${functionDetails.name}] Raw simulation result:`,
      rawResult
    );

    // --- Format Result --- //
    const formattedResult = formatStellarFunctionResult(rawResult, functionDetails);

    logger.info(
      'queryStellarViewFunction',
      `[Query ${functionDetails.name}] Formatted result:`,
      formattedResult
    );

    return formattedResult;
  } catch (error) {
    const errorMessage = `Failed to query Stellar view function ${functionId} on network ${networkConfig.name}: ${(error as Error).message}`;
    logger.error('queryStellarViewFunction', errorMessage, {
      contractAddress,
      functionId,
      params,
      networkConfig,
      error,
    });
    throw new Error(errorMessage);
  }
}
