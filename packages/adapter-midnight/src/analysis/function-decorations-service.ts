import type { FunctionDecorationsMap } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { evaluateContractModule } from '../transaction/contract-evaluator';
import { evaluateWitnessCode } from '../transaction/witness-evaluator';
import type { MidnightContractArtifacts } from '../types';
import { extractPureCircuits } from '../utils/circuit-type-utils';
import { detectOrganizerOnlyBySource } from './organizer-only-detector';

const SYSTEM_LOG_TAG = 'FunctionDecorationsService';

/**
 * Service to orchestrate function decoration analysis and detection
 * Handles caching, detection workflow, and results mapping
 */
export class FunctionDecorationsService {
  private cache: Map<string, FunctionDecorationsMap> = new Map();

  /**
   * Analyzes artifacts and returns function decorations (badges, notes, etc.)
   *
   * @param artifacts - Contract artifacts to analyze
   * @returns Map of function IDs to their decorations, or undefined if analysis failed
   */
  async analyzeFunctionDecorations(
    artifacts: MidnightContractArtifacts | null
  ): Promise<FunctionDecorationsMap | undefined> {
    if (!artifacts) {
      logger.debug(SYSTEM_LOG_TAG, 'No artifacts provided; skipping analysis.');
      return undefined;
    }

    const cacheKey = this.generateCacheKey(artifacts);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      logger.debug(SYSTEM_LOG_TAG, 'Using cached function decorations');
      return this.cache.get(cacheKey);
    }

    logger.info(SYSTEM_LOG_TAG, 'Analyzing contract functions for decorations...');

    try {
      const organizerOnlyResults = await this.detectOrganizerOnlyCircuits(artifacts);
      const pureCircuitResults = await this.detectPureCircuits(artifacts);
      const decorations = mapDetectionToDecorations(organizerOnlyResults, pureCircuitResults);

      // Cache results
      this.cache.set(cacheKey, decorations);

      const organizerCount = Object.values(organizerOnlyResults).filter(Boolean).length;
      const pureCount = Object.values(pureCircuitResults).filter(Boolean).length;
      logger.info(
        SYSTEM_LOG_TAG,
        `Analysis complete: ${organizerCount} organizer-only circuits, ${pureCount} pure circuits identified`
      );

      return decorations;
    } catch (error) {
      logger.error(
        SYSTEM_LOG_TAG,
        'Function decoration analysis failed',
        error instanceof Error ? error.message : String(error)
      );
      return undefined;
    }
  }

  /**
   * Detects organizer-only circuits from artifacts
   * Orchestrates the workflow: evaluate witnesses → load runtime → evaluate contracts → detect
   *
   * @private
   */
  private async detectOrganizerOnlyCircuits(
    artifacts: MidnightContractArtifacts
  ): Promise<Record<string, boolean>> {
    // Step 1: Evaluate witness code
    logger.debug(SYSTEM_LOG_TAG, 'Step 1: Evaluating witness code');
    const witnessCode = artifacts.witnessCode || '';
    const baseWitnesses = evaluateWitnessCode(witnessCode);

    // Step 2: Load and inject compact-runtime
    logger.debug(SYSTEM_LOG_TAG, 'Step 2: Loading compact-runtime');
    const runtimeNs = await import('@midnight-ntwrk/compact-runtime');
    const compactRuntime = (runtimeNs as Record<string, unknown>)?.default ?? runtimeNs;

    // Step 3: Evaluate contract module
    logger.debug(SYSTEM_LOG_TAG, 'Step 3: Evaluating contract module');
    const contractModule = artifacts.contractModule || '';
    const contractInstance = evaluateContractModule(contractModule, baseWitnesses, {
      '@midnight-ntwrk/compact-runtime': compactRuntime,
    });

    // Step 4: Extract impure circuits and run detection
    if (!contractInstance || typeof contractInstance !== 'object') {
      logger.warn(SYSTEM_LOG_TAG, 'Contract instance not available for detection');
      return {};
    }

    const instance = contractInstance as Record<string, unknown>;
    const circuitMap = instance.impureCircuits as Record<string, unknown> | undefined;

    if (!circuitMap || Object.keys(circuitMap).length === 0) {
      logger.info(SYSTEM_LOG_TAG, 'No impure circuits found');
      return {};
    }

    logger.debug(
      SYSTEM_LOG_TAG,
      `Step 4: Analyzing ${Object.keys(circuitMap).length} impure circuits`
    );

    // Use source inspection to detect identity-witness calls
    return detectOrganizerOnlyBySource(
      circuitMap,
      baseWitnesses,
      instance as Record<string, unknown>
    );
  }

  /**
   * Detects pure circuits from artifacts
   * Pure circuits are computational functions that run locally without blockchain interaction
   * Detection is done by parsing the contract definition (.d.ts) to find PureCircuits type
   *
   * @private
   */
  private async detectPureCircuits(
    artifacts: MidnightContractArtifacts
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Method 1: Parse contract definition to find PureCircuits type
    if (artifacts.contractDefinition) {
      logger.debug(SYSTEM_LOG_TAG, 'Detecting pure circuits from contract definition');

      // Helper functions for extractPureCircuits
      const parseParameters = (): [] => []; // Pure circuits don't need parameter parsing for detection
      const capitalizeFirst = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

      const pureCircuitsMap = extractPureCircuits(
        artifacts.contractDefinition,
        parseParameters,
        capitalizeFirst
      );

      for (const circuitId of Object.keys(pureCircuitsMap)) {
        results[circuitId] = true;
        logger.debug(SYSTEM_LOG_TAG, `Found pure circuit in definition: ${circuitId}`);
      }
    }

    // Method 2: Fallback to runtime evaluation if contract definition parsing didn't find any
    if (Object.keys(results).length === 0 && artifacts.contractModule) {
      logger.debug(SYSTEM_LOG_TAG, 'Falling back to runtime evaluation for pure circuit detection');
      try {
        // Step 1: Evaluate witness code
        const witnessCode = artifacts.witnessCode || '';
        const baseWitnesses = evaluateWitnessCode(witnessCode);

        // Step 2: Load and inject compact-runtime
        const runtimeNs = await import('@midnight-ntwrk/compact-runtime');
        const compactRuntime = (runtimeNs as Record<string, unknown>)?.default ?? runtimeNs;

        // Step 3: Evaluate contract module
        const contractModule = artifacts.contractModule || '';
        const contractInstance = evaluateContractModule(contractModule, baseWitnesses, {
          '@midnight-ntwrk/compact-runtime': compactRuntime,
        });

        // Step 4: Extract pure circuits
        if (contractInstance && typeof contractInstance === 'object') {
          const instance = contractInstance as Record<string, unknown>;
          const pureCircuitsMap = instance.pureCircuits as Record<string, unknown> | undefined;

          if (pureCircuitsMap && Object.keys(pureCircuitsMap).length > 0) {
            logger.debug(
              SYSTEM_LOG_TAG,
              `Found ${Object.keys(pureCircuitsMap).length} pure circuits via runtime evaluation`
            );

            // Map pure circuit names to true
            for (const circuitName of Object.keys(pureCircuitsMap)) {
              results[circuitName] = true;
            }
          }
        }
      } catch (error) {
        logger.warn(
          SYSTEM_LOG_TAG,
          'Runtime evaluation failed for pure circuit detection',
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    if (Object.keys(results).length > 0) {
      logger.debug(
        SYSTEM_LOG_TAG,
        `Detected ${Object.keys(results).length} pure circuits: ${Object.keys(results).join(', ')}`
      );
    } else {
      logger.debug(SYSTEM_LOG_TAG, 'No pure circuits detected');
    }

    return results;
  }

  /**
   * Generates a cache key from artifacts
   *
   * @private
   */
  private generateCacheKey(artifacts: MidnightContractArtifacts): string {
    const contractAddress = artifacts.contractAddress ?? '';
    const privateStateId = artifacts.privateStateId ?? '';
    const artifactHash = JSON.stringify(artifacts).substring(0, 32);
    return `${contractAddress}|${privateStateId}|${artifactHash}`;
  }

  /**
   * Clears the cache (useful for testing or manual reset)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Maps detection results to function decorations
 *
 * @internal
 */
function mapDetectionToDecorations(
  organizerOnlyResults: Record<string, boolean>,
  pureCircuitResults: Record<string, boolean>
): FunctionDecorationsMap {
  const decorations: FunctionDecorationsMap = {};

  // Map organizer-only circuits
  for (const [circuitId, isOrganizerOnly] of Object.entries(organizerOnlyResults)) {
    if (isOrganizerOnly) {
      decorations[circuitId] = {
        badges: [
          {
            text: 'Identity-restricted',
            variant: 'warning',
            tooltip:
              'Detected based on code analysis. This function appears to require an identity secret. The system scans for identity witness calls in the compiled contract code.',
          },
        ],
        note: {
          title: 'Identity-restricted circuit (automated detection)',
          body: 'This circuit requires an identity secret. A form field will be added automatically where you can enter it when executing the transaction. The secret is never stored and is only used for this transaction.\n\nNote: Detection is based on static code analysis and may occasionally produce false positives.',
        },
        requiresRuntimeSecret: true,
      };
    }
  }

  // Map pure circuits (may combine with organizer-only if both apply)
  for (const [circuitId, isPureCircuit] of Object.entries(pureCircuitResults)) {
    if (isPureCircuit) {
      const existing = decorations[circuitId];
      decorations[circuitId] = {
        ...existing,
        badges: [
          ...(existing?.badges || []),
          {
            text: 'Pure Circuit',
            variant: 'info',
            tooltip:
              'Runs locally without blockchain interaction. This function executes entirely client-side and returns a result immediately.',
          },
        ],
        note: existing?.note || {
          title: 'Pure Circuit',
          body: 'This circuit runs locally without submitting a transaction to the blockchain. It executes entirely client-side and returns a result immediately. No wallet connection is required.',
        },
      };
    }
  }

  return decorations;
}
