import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

import { logger } from '@openzeppelin/ui-builder-utils';

const SYSTEM_LOG_TAG = 'callCircuit';

/**
 * Parameters for calling a Midnight circuit (transaction function)
 */
export interface CallCircuitParams {
  /** The dynamically evaluated contract instance */
  contractInstance: unknown;
  /** All required Midnight providers (wallet, proof, indexer, etc.) */
  providers: MidnightProviders;
  /** The contract's deployed address */
  contractAddress: string;
  /** The circuit identifier (function name) */
  circuitId: string;
  /** The private state ID for this contract */
  privateStateId: string;
  /** Arguments to pass to the circuit */
  args: unknown[];
}

/**
 * Result from a successful circuit call
 */
export interface CallCircuitResult {
  /** The transaction hash */
  txHash: string;
  /** Next private state if the circuit modified it (optional) */
  nextPrivateState?: unknown;
}

/**
 * Friendly circuit call wrapper that handles private state hydration, error mapping, and tx hash extraction.
 *
 * This helper encapsulates the boilerplate of:
 * 1. Calling findDeployedContract to ensure private state is available
 * 2. Handling missing private state gracefully
 * 3. Calling submitCallTx with proper error context
 * 4. Persisting updated private state after the call
 * 5. Extracting and returning the transaction hash
 *
 * @param params Call parameters
 * @returns The transaction hash and optional updated private state
 * @throws Friendly error messages for common failure modes
 */
export async function callCircuit(params: CallCircuitParams): Promise<CallCircuitResult> {
  const { contractInstance, providers, contractAddress, circuitId, privateStateId, args } = params;

  logger.info(SYSTEM_LOG_TAG, `Calling circuit: ${circuitId}`, {
    contractAddress,
    privateStateId,
    argsLength: args.length,
  });

  try {
    // Step 1: Attempt to hydrate private state from chain if missing locally
    logger.debug(SYSTEM_LOG_TAG, 'Step 1: Ensuring private state is available');
    try {
      const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
      const minimalContract = contractInstance as unknown as {
        impureCircuits: Record<string, unknown>;
      };
      await findDeployedContract(providers, {
        contract: minimalContract as Parameters<typeof findDeployedContract>[1]['contract'],
        contractAddress,
        privateStateId,
      });
      logger.debug(SYSTEM_LOG_TAG, 'Private state hydrated successfully');
    } catch (hydrateErr) {
      logger.debug(
        SYSTEM_LOG_TAG,
        'Private state hydration failed (may succeed on initial call)',
        hydrateErr
      );
    }

    // Step 2: Build transaction options
    logger.debug(SYSTEM_LOG_TAG, 'Step 2: Building transaction options');
    const txOptions = {
      contract: contractInstance,
      circuitId,
      contractAddress,
      privateStateId,
      args,
    };

    // Step 3: Check if we should omit privateStateId (if still missing after hydration)
    logger.debug(SYSTEM_LOG_TAG, 'Step 3: Checking private state availability');
    let omitPrivateStateId = false;
    try {
      const existingPrivateState = await providers.privateStateProvider.get(privateStateId);
      if (existingPrivateState == null) {
        omitPrivateStateId = true;
        logger.debug(
          SYSTEM_LOG_TAG,
          'Local private state missing; will call without privateStateId and persist after'
        );
      }
    } catch {
      omitPrivateStateId = true;
    }

    // Step 4: Build call options, omitting privateStateId if needed
    const callOptions: Record<string, unknown> = omitPrivateStateId
      ? { ...txOptions }
      : (txOptions as unknown as Record<string, unknown>);
    if (omitPrivateStateId) {
      delete callOptions.privateStateId;
    }

    // Step 5: Execute the circuit call
    logger.debug(SYSTEM_LOG_TAG, 'Step 5: Submitting circuit call');
    const { submitCallTx } = await import('@midnight-ntwrk/midnight-js-contracts');

    type TxResult = {
      txHash?: string;
      hash?: string;
      deployTxData?: { public?: { txHash?: string } };
      public?: { txHash?: string };
      private?: { nextPrivateState?: unknown };
    };

    let txResult: TxResult | undefined;
    try {
      txResult = (await submitCallTx(
        providers,
        callOptions as Parameters<typeof submitCallTx>[1]
      )) as TxResult;
      logger.debug(SYSTEM_LOG_TAG, 'Circuit call succeeded', {
        hasTxHash: !!txResult?.txHash,
        hasNextState: !!txResult?.private?.nextPrivateState,
      });
    } catch (callError: unknown) {
      const error = callError as { message?: string; code?: string };
      const message = error?.message || 'Unknown error';

      // Map common SDK errors to friendly messages
      if (message.includes('proof')) {
        throw new Error(`Zero-knowledge proof generation failed: ${message}`);
      }
      if (message.includes('User')) {
        throw new Error('Transaction was rejected by the user');
      }
      if (message.includes('balance')) {
        throw new Error('Insufficient balance or coins available for transaction');
      }
      if (message.includes('undeployed') || message.includes('Undeployed')) {
        throw new Error(`Contract not deployed at address: ${contractAddress}`);
      }

      throw new Error(`Circuit call failed: ${message}`);
    }

    // Step 6: Persist updated private state if it was omitted and is now available
    if (omitPrivateStateId && txResult?.private?.nextPrivateState) {
      logger.debug(SYSTEM_LOG_TAG, 'Step 6: Persisting updated private state');
      try {
        await providers.privateStateProvider.set(privateStateId, txResult.private.nextPrivateState);
        logger.debug(SYSTEM_LOG_TAG, 'Private state persisted successfully');
      } catch (persistErr) {
        logger.warn(
          SYSTEM_LOG_TAG,
          'Failed to persist private state (non-fatal, transaction already submitted):',
          persistErr
        );
      }
    }

    // Step 7: Extract transaction hash with fallback
    const txHash =
      txResult?.txHash ||
      txResult?.hash ||
      txResult?.deployTxData?.public?.txHash ||
      txResult?.public?.txHash ||
      `midnight_tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    logger.info(SYSTEM_LOG_TAG, `Circuit call complete: ${txHash}`);

    return {
      txHash,
      nextPrivateState: txResult?.private?.nextPrivateState,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(SYSTEM_LOG_TAG, `Circuit call failed: ${message}`);
    throw error;
  }
}
