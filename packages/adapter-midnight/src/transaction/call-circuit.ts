import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

import { logger } from '@openzeppelin/ui-builder-utils';

import { resolveSecretPropertyName } from '../utils/secret-property-helpers';
import { enhanceMidnightError, formatEnhancedError } from './error-enhancer';

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
  /** Optional configured private-state property that holds the identity secret key */
  identitySecretKeyPropertyName?: string;
}

/**
 * Result from a successful circuit call
 */
export interface CallCircuitResult {
  /** The transaction hash */
  txHash: string;
  /** Next private state if the circuit modified it (optional) */
  nextPrivateState?: unknown;
  /** Return value from the circuit execution (if any) */
  result?: unknown;
}

/**
 * Friendly circuit call wrapper that handles private state validation, error mapping, and tx hash extraction.
 *
 * This helper encapsulates the boilerplate of:
 * 1. Checking private state availability (participant-only circuits may not require it)
 * 2. Building transaction options with contractInstance, circuitId, and args
 * 3. Calling submitCallTx with private state ID always included
 * 4. Handling SDK errors and mapping them to friendly messages
 * 5. Persisting updated private state after the call
 * 6. Extracting and returning the transaction hash
 *
 * @param params Call parameters
 * @returns The transaction hash and optional updated private state
 * @throws Error with friendly message for common failure modes (proof generation, insufficient balance, missing private state for organizer-only circuits, etc.)
 */
export async function callCircuit(params: CallCircuitParams): Promise<CallCircuitResult> {
  const { contractInstance, providers, contractAddress, circuitId, privateStateId, args } = params;

  logger.info(SYSTEM_LOG_TAG, `Calling circuit: ${circuitId}`, {
    contractAddress,
    privateStateId,
    argsLength: args.length,
  });

  try {
    // Import submitCallTx at the start to avoid forward reference issues
    const { submitCallTx } = await import('@midnight-ntwrk/midnight-js-contracts');

    // Step 2: Build transaction options
    logger.debug(SYSTEM_LOG_TAG, 'Step 2: Building transaction options');
    const txOptions = {
      contract: contractInstance,
      circuitId,
      contractAddress,
      privateStateId,
      args,
    };

    // Step 3: Check private state availability, but don't fail preemptively
    // For participant-only circuits, private state may not exist initially, which is fine.
    // For organizer-only circuits, the overlay will inject the organizer key.
    // Let the SDK handle actual validation and report errors appropriately.
    logger.debug(SYSTEM_LOG_TAG, 'Step 3: Checking private state availability');
    let existingPrivateState: unknown = null;
    try {
      const state = await providers.privateStateProvider.get(privateStateId);
      if (state == null) {
        logger.debug(
          SYSTEM_LOG_TAG,
          'No existing private state found; proceeding (may be fine for participant-only circuits)'
        );
      } else {
        existingPrivateState = state;
        logger.debug(SYSTEM_LOG_TAG, 'Private state found');
      }
    } catch (err) {
      // Treat storage read errors as missing state (not an error condition)
      logger.debug(
        SYSTEM_LOG_TAG,
        'Failed to read private state (treating as missing and proceeding):',
        err instanceof Error ? err.message : 'Unknown error'
      );
      existingPrivateState = null;
    }

    // Step 4: Build call options (always include privateStateId)
    const callOptions = txOptions as Parameters<typeof submitCallTx>[1];

    // Step 5: Execute the circuit call
    logger.debug(SYSTEM_LOG_TAG, 'Step 5: Submitting circuit call');

    // Use intersection type to preserve actual return type while allowing access to optional properties
    type TxResult = Awaited<ReturnType<typeof submitCallTx>> & Record<string, unknown>;

    let txResult: TxResult | undefined;
    try {
      txResult = (await submitCallTx(providers, callOptions)) as TxResult;
      logger.debug(SYSTEM_LOG_TAG, 'Circuit call succeeded', {
        hasTxHash:
          !!(txResult?.public as { txHash?: string })?.txHash ||
          !!(txResult as { txHash?: string })?.txHash,
        hasNextState: !!txResult?.private?.nextPrivateState,
        hasPublicResult: !!(txResult?.public as { result?: unknown })?.result,
        hasResult: !!(txResult as { result?: unknown })?.result,
        txResultKeys: txResult ? Object.keys(txResult) : [],
      });
    } catch (callError: unknown) {
      const error = callError as { message?: string; code?: string };
      const message = error?.message || 'Unknown error';

      // Log the actual SDK error for debugging
      logger.debug(SYSTEM_LOG_TAG, 'SDK error received:', {
        message,
        code: error?.code,
        hasExistingState: existingPrivateState != null,
      });

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

      // Handle private state errors - be specific about what errors indicate missing organizer key
      const prover400 =
        /Failed Proof Server response:.*code="400"/.test(message) ||
        /status="Bad Request"/.test(message);

      // Only map to identity-secret error if it's a specific error about missing secret key
      // The overlay now returns {} instead of null, so missing state errors indicate secret key is needed
      const secretProp = resolveSecretPropertyName(
        { identitySecretKeyPropertyName: params.identitySecretKeyPropertyName },
        'organizerSecretKey'
      )!; // Safe to assert non-null since we provide a default

      const isIdentitySecretError =
        message.includes(secretProp) ||
        message.includes('No private state found at private state ID') ||
        (message.includes('Private state') && message.includes('not initialized'));

      if (
        message.includes('Incorrect call transaction configuration') ||
        isIdentitySecretError ||
        (prover400 && !existingPrivateState && isIdentitySecretError)
      ) {
        throw new Error(
          'Private state not initialized or identity secret key missing. ' +
            'For identity-restricted circuits, provide the Identity Secret Key in the form ' +
            'so the private state can be seeded.'
        );
      }

      if (prover400) {
        throw new Error(
          'Proof server rejected the request (400). Please verify arguments and ZK artifacts are correct.'
        );
      }

      throw new Error(`Circuit call failed: ${message}`);
    }

    // Step 6: Persist updated private state if it was omitted and is now available
    if (txResult?.private?.nextPrivateState) {
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
      (txResult?.public as { txHash?: string })?.txHash ||
      (txResult as { txHash?: string })?.txHash ||
      (txResult as { hash?: string })?.hash ||
      (txResult as { deployTxData?: { public?: { txHash?: string } } })?.deployTxData?.public
        ?.txHash ||
      `midnight_tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    logger.info(SYSTEM_LOG_TAG, `Circuit call complete: ${txHash}`);

    return {
      txHash,
      nextPrivateState: txResult?.private?.nextPrivateState,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(SYSTEM_LOG_TAG, `Circuit call failed: ${message}`);

    // Enhance error message with user-friendly information
    const enhanced = enhanceMidnightError(error, circuitId);
    const friendlyMessage = formatEnhancedError(enhanced);

    // Throw enhanced error with friendly message
    const enhancedError = new Error(friendlyMessage);
    // Preserve original stack trace if available
    if (error instanceof Error && error.stack) {
      enhancedError.stack = error.stack;
    }
    throw enhancedError;
  }
}
