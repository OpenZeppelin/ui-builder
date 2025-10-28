import type { FunctionDecorationsMap } from '@openzeppelin/ui-builder-types';
import { logger } from '@openzeppelin/ui-builder-utils';

import { evaluateContractModule } from '../transaction/contract-evaluator';
import { evaluateWitnessCode } from '../transaction/witness-evaluator';
import type { MidnightContractArtifacts } from '../types';
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
      const detectionResults = await this.detectOrganizerOnlyCircuits(artifacts);
      const decorations = mapDetectionToDecorations(detectionResults);

      // Cache results
      this.cache.set(cacheKey, decorations);

      const decorationCount = Object.values(detectionResults).filter(Boolean).length;
      logger.info(
        SYSTEM_LOG_TAG,
        `Analysis complete: ${decorationCount} organizer-only circuits identified`
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
 * Maps organizer-only detection results to function decorations
 *
 * @internal
 */
function mapDetectionToDecorations(
  detectionResults: Record<string, boolean>
): FunctionDecorationsMap {
  const decorations: FunctionDecorationsMap = {};

  for (const [circuitId, isOrganizerOnly] of Object.entries(detectionResults)) {
    if (isOrganizerOnly) {
      decorations[circuitId] = {
        badges: [
          {
            text: 'Organizer-only',
            variant: 'warning',
            tooltip:
              'Detected based on code analysis. This function appears to require organizer credentials. The system scans for identity witness calls in the compiled contract code.',
          },
        ],
        note: {
          title: 'Organizer-only circuit (automated detection)',
          body: 'Our analysis detected that this circuit likely requires an organizer secret key based on the compiled contract code. This is an automated detection that scans for identity witness calls (local_sk, organizer_key, etc.) in the function implementation and its helper methods.\n\nIf detected correctly, you will be prompted to provide your organizer secret key at execution time. The key is never stored and is only used for this transaction.\n\nNote: This detection is based on static code analysis and may occasionally produce false positives or miss edge cases.',
        },
        requiresRuntimeSecret: true,
      };
    }
  }

  return decorations;
}
