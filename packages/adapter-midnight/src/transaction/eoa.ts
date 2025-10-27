import type { TransactionStatusUpdate } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { WriteContractParameters } from '../types';
import type { LaceWalletImplementation } from '../wallet/implementation/lace-implementation';
import { callCircuit } from './call-circuit';
import { evaluateContractModule } from './contract-evaluator';
import type { ExecutionStrategy, MidnightExecutionConfig } from './execution-strategy';
import { createTransactionProviders } from './providers';
import { evaluateWitnessCode } from './witness-evaluator';

const SYSTEM_LOG_TAG = 'MidnightEoaExecutionStrategy';

/**
 * Implements full EOA transaction execution for Midnight
 */
export class EoaExecutionStrategy implements ExecutionStrategy {
  public async execute(
    transactionData: WriteContractParameters,
    executionConfig: MidnightExecutionConfig,
    walletImplementation: LaceWalletImplementation,
    onStatusChange: (status: string, details: TransactionStatusUpdate) => void,
    _runtimeApiKey?: string
  ): Promise<{ txHash: string }> {
    logger.info(SYSTEM_LOG_TAG, 'Executing EOA transaction', {
      contractAddress: transactionData.contractAddress,
      functionName: transactionData.functionName,
    });

    try {
      // Step 0: Validate wallet connectivity
      const api = walletImplementation.getApi();
      if (!api) {
        throw new Error('Wallet not connected. Please connect a wallet first.');
      }

      const walletState = await api.state();
      if (!walletState || !walletState.address) {
        throw new Error('Unable to retrieve wallet state. Wallet may be locked or disconnected.');
      }

      logger.info(SYSTEM_LOG_TAG, `Connected wallet address: ${walletState.address}`);

      // Step 1: Set network ID (required for SDK operations)
      // Pattern: query handler lines 161-180
      const networkConfig = executionConfig.networkConfig;
      if (!networkConfig || networkConfig.ecosystem !== 'midnight') {
        throw new Error('Invalid network configuration');
      }

      // Dynamic import to avoid loading at module initialization
      const { NetworkId, setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');

      const networkIdEntry = Object.entries(networkConfig.networkId || {})[0];
      if (!networkIdEntry) {
        throw new Error('Network ID not configured');
      }
      const [, networkName] = networkIdEntry;
      const networkIdEnum = (NetworkId as Record<string, unknown>)[networkName as string];
      if (!networkIdEnum) {
        throw new Error(`Invalid network ID: ${networkName}`);
      }
      setNetworkId(networkIdEnum as never);

      // Set global override for patched providers
      const globalMidnight = globalThis as {
        __OPENZEPPELIN_MIDNIGHT__?: {
          networkId?: unknown;
          compactRuntime?: unknown;
        };
      };
      if (!globalMidnight.__OPENZEPPELIN_MIDNIGHT__) {
        globalMidnight.__OPENZEPPELIN_MIDNIGHT__ = {};
      }
      globalMidnight.__OPENZEPPELIN_MIDNIGHT__.networkId = networkIdEnum;

      logger.debug(SYSTEM_LOG_TAG, `Set network ID to: ${networkName}`);

      // Step 2: Initialize providers
      onStatusChange('preparing', {});
      const providers = await createTransactionProviders(walletImplementation, networkConfig);

      // Step 3: Load witness functions from artifacts
      const artifacts = executionConfig.artifacts;
      if (!artifacts || !artifacts.contractModule) {
        throw new Error(
          'Contract artifacts are missing the required "contractModule" field. ' +
            'Please ensure your contract artifacts include the compiled contract code (contract.cjs content) ' +
            'in the "contractModule" field when loading the contract.'
        );
      }

      // Preflight validate critical identifiers before calling SDK (avoids opaque WASM errors)
      const contractAddress =
        typeof transactionData.contractAddress === 'string'
          ? transactionData.contractAddress.trim()
          : '';
      if (!contractAddress) {
        throw new Error('Invalid contract address: empty or non-string value');
      }
      const privateStateId =
        typeof artifacts.privateStateId === 'string' ? artifacts.privateStateId.trim() : '';
      if (!privateStateId) {
        throw new Error('Invalid Private State ID: empty or non-string value');
      }

      const witnesses = evaluateWitnessCode(artifacts.witnessCode || '');

      logger.debug(SYSTEM_LOG_TAG, 'Artifacts received for execution:', {
        hasOrganizerKey: !!artifacts.organizerSecretKeyHex,
        organizerKeyLength: artifacts.organizerSecretKeyHex?.length || 0,
        privateStateId,
      });

      // Step 4: Load and inject compact-runtime to ensure WASM context unity
      // This forces the evaluated contract to use the SAME runtime instance as the SDK
      const runtimeNs = await import('@midnight-ntwrk/compact-runtime');
      // Unwrap ESM default for CJS consumers to avoid interop issues
      const compactRuntime = (runtimeNs as Record<string, unknown>)?.default ?? runtimeNs;

      // Expose globally for debugging and potential fallback mechanisms
      // Reuse the existing globalMidnight variable from Step 1
      globalMidnight.__OPENZEPPELIN_MIDNIGHT__!.compactRuntime = compactRuntime;

      logger.debug(SYSTEM_LOG_TAG, 'Injecting shared compact-runtime', {
        version: (compactRuntime as { versionString?: string })?.versionString,
      });

      // Seed private state if missing and organizerSecretKeyHex is provided
      if (artifacts.organizerSecretKeyHex) {
        try {
          const existing = await providers.privateStateProvider.get(privateStateId);
          if (existing == null) {
            const hex = artifacts.organizerSecretKeyHex.trim().replace(/^0x/, '');
            const bytes = new Uint8Array(hex.length / 2);
            for (let i = 0; i < bytes.length; i++) {
              bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
            }
            await providers.privateStateProvider.set(privateStateId, { organizerSecretKey: bytes });
            logger.debug(SYSTEM_LOG_TAG, 'Seeded private state with organizer secret key');
          }
        } catch (seedErr) {
          logger.warn(SYSTEM_LOG_TAG, 'Failed to seed private state with organizer key:', seedErr);
        }
      }

      // Step 5: Create contract instance with injected dependencies
      // evaluateContractModule internally instantiates new Contract(witnesses)
      const contractInstance = evaluateContractModule(artifacts.contractModule, witnesses, {
        '@midnight-ntwrk/compact-runtime': compactRuntime,
      });

      // Step 6: Verify runtime identity (sanity check)
      const contractModule = contractInstance as Record<string, unknown>;
      const runtimeCheck = contractModule.__compactRuntime as
        | { versionString?: string }
        | undefined;
      const compactRuntimeVersion = (compactRuntime as { versionString?: string })?.versionString;
      if (runtimeCheck?.versionString) {
        logger.debug(SYSTEM_LOG_TAG, 'Runtime identity check:', {
          contractVersion: runtimeCheck.versionString,
          sdkVersion: compactRuntimeVersion,
          matched: runtimeCheck.versionString === compactRuntimeVersion,
        });
      }

      // Step 7: Signal transaction is about to be submitted
      onStatusChange('pendingSignature', {});

      logger.info(
        SYSTEM_LOG_TAG,
        `Executing transaction: ${transactionData.functionName}`,
        transactionData.args
      );

      // Step 8: Use callCircuit helper to execute the circuit with clean error handling
      const result = await callCircuit({
        contractInstance,
        providers,
        contractAddress,
        circuitId: transactionData.functionName,
        privateStateId,
        args: transactionData.args,
      });

      logger.info(SYSTEM_LOG_TAG, `Transaction submitted: ${result.txHash}`);

      onStatusChange('pendingConfirmation', { txHash: result.txHash });

      return { txHash: result.txHash };
    } catch (error) {
      logger.error(SYSTEM_LOG_TAG, 'Transaction execution failed:', error);

      // Re-throw with potentially cleaner error message
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(`Transaction failed: Unknown error`);
    }
  }
}
