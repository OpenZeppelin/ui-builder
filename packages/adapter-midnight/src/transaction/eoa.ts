import type { TransactionStatusUpdate } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import type { WriteContractParameters } from '../types';
import type { LaceWalletImplementation } from '../wallet/implementation/lace-implementation';
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

      // Step 7: Prepare to call transaction
      // WORKAROUND: createCircuitCallTxInterface has issues with dynamically evaluated contracts
      // Instead, we'll manually call the SDK functions to build and submit the transaction
      const { submitCallTx } = await import('@midnight-ntwrk/midnight-js-contracts');

      logger.debug(
        SYSTEM_LOG_TAG,
        'Preparing to manually build and submit transaction (bypassing interface)'
      );

      // Debug: Check provider structure
      logger.debug(SYSTEM_LOG_TAG, 'Provider structure check:', {
        hasWalletProvider: !!providers.walletProvider,
        hasCoinPublicKey: !!providers.walletProvider?.coinPublicKey,
        coinPublicKeyValue: providers.walletProvider?.coinPublicKey,
        coinPublicKeyLength: providers.walletProvider?.coinPublicKey?.length,
        coinPublicKeyType: typeof providers.walletProvider?.coinPublicKey,
      });

      // Step 8: Prepare to execute method
      onStatusChange('pendingSignature', {});

      // Step 8.1: Explicitly ensure private state if missing by hydrating via findDeployedContract
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingPrivateState = await (providers as any).privateStateProvider?.get(
          privateStateId as unknown
        );
        if (existingPrivateState == null) {
          logger.debug(
            SYSTEM_LOG_TAG,
            'Local private state missing; hydrating via findDeployedContract'
          );
          const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
          // Build a minimal contract object compatible with findDeployedContract
          const minimalContract = contractInstance as unknown as {
            impureCircuits: Record<string, unknown>;
          };
          await findDeployedContract(
            providers as unknown as Parameters<typeof findDeployedContract>[0],
            {
              contract: minimalContract as Parameters<typeof findDeployedContract>[1]['contract'],
              contractAddress,
              privateStateId,
            } as Parameters<typeof findDeployedContract>[1]
          );
        }
      } catch (hydrateErr) {
        logger.warn(
          SYSTEM_LOG_TAG,
          'ensurePrivateState hydration step failed (will rely on preflight fallback):',
          hydrateErr
        );
      }

      // Step 9: Execute the contract method directly using submitCallTx
      // Build the transaction options manually
      const txOptions = {
        contract: contractInstance,
        circuitId: transactionData.functionName,
        contractAddress,
        privateStateId,
        args: transactionData.args,
      };

      logger.info(
        SYSTEM_LOG_TAG,
        `Executing transaction: ${transactionData.functionName}`,
        transactionData.args
      );

      logger.debug(SYSTEM_LOG_TAG, 'Transaction options:', {
        circuitId: txOptions.circuitId,
        hasContract: !!txOptions.contract,
        contractAddress: txOptions.contractAddress,
        privateStateId: txOptions.privateStateId,
        argsLength: txOptions.args.length,
      });

      type TxResult = {
        txHash?: string;
        hash?: string;
        deployTxData?: { public?: { txHash?: string } };
        public?: { txHash?: string };
        private?: { nextPrivateState?: unknown };
      };
      let txResult: TxResult | undefined;
      try {
        // Call submitCallTx directly with providers and options
        logger.debug(SYSTEM_LOG_TAG, 'Calling submitCallTx directly');
        logger.debug(SYSTEM_LOG_TAG, 'Full providers object:', {
          hasPrivateStateProvider: !!providers.privateStateProvider,
          hasZkConfigProvider: !!providers.zkConfigProvider,
          hasProofProvider: !!providers.proofProvider,
          hasPublicDataProvider: !!providers.publicDataProvider,
          hasWalletProvider: !!providers.walletProvider,
          hasMidnightProvider: !!providers.midnightProvider,
          walletProviderKeys: providers.walletProvider ? Object.keys(providers.walletProvider) : [],
          coinPublicKey: providers.walletProvider?.coinPublicKey,
          encryptionPublicKey: providers.walletProvider?.encryptionPublicKey,
        });

        // Preflight: If the local private state is missing, call without privateStateId and persist after
        let omitPrivateStateId = false;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingPrivateState = await (providers as any).privateStateProvider?.get(
            privateStateId as unknown
          );
          if (existingPrivateState == null) {
            omitPrivateStateId = true;
          }
        } catch {
          omitPrivateStateId = true;
        }

        const callOptions: Record<string, unknown> = omitPrivateStateId
          ? { ...txOptions }
          : (txOptions as unknown as Record<string, unknown>);
        if (omitPrivateStateId) {
          delete callOptions.privateStateId;
          logger.debug(
            SYSTEM_LOG_TAG,
            'Local private state missing; omitting privateStateId for initial call'
          );
        }

        txResult = (await submitCallTx(
          providers as unknown as Parameters<typeof submitCallTx>[0],
          callOptions as unknown as Parameters<typeof submitCallTx>[1]
        )) as TxResult;
        if (omitPrivateStateId && txResult?.private?.nextPrivateState) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (providers as any).privateStateProvider?.set(
              privateStateId as unknown,
              txResult.private.nextPrivateState
            );
            logger.debug(
              SYSTEM_LOG_TAG,
              'Persisted private state after initial call under ID:',
              privateStateId
            );
          } catch {
            // Best effort; do not fail the transaction if persistence fails
          }
        }
        logger.debug(SYSTEM_LOG_TAG, 'Transaction result:', txResult);
      } catch (callError: unknown) {
        // Log more details about the error
        const error = callError as { message?: string; stack?: string };
        logger.error(SYSTEM_LOG_TAG, 'CallTx error details:', {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5),
        });
        throw callError;
      }

      // Step 10: Extract transaction hash from result
      // Pattern: deploy.ts lines 283-298 shows txHash is in deployTxData.public
      const txHash =
        txResult?.txHash ||
        txResult?.hash ||
        txResult?.deployTxData?.public?.txHash ||
        txResult?.public?.txHash ||
        `midnight_tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      logger.info(SYSTEM_LOG_TAG, `Transaction submitted: ${txHash}`);

      onStatusChange('pendingConfirmation', { txHash });

      return { txHash };
    } catch (error) {
      logger.error(SYSTEM_LOG_TAG, 'Transaction execution failed:', error);

      // Handle user rejection
      if (error instanceof Error && error.message.includes('User')) {
        throw new Error('Transaction was rejected by user');
      }

      // Handle proof errors
      if (error instanceof Error && error.message.includes('proof')) {
        throw new Error(`Zero-knowledge proof generation failed: ${error.message}`);
      }

      // Generic error
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
  }
}
