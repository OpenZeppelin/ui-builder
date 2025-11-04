import { logger } from '@openzeppelin/ui-builder-utils';

const SYSTEM_LOG_TAG = 'OrganizerOnlyDetector';

/**
 * Identity witness aliases that indicate organizer/owner status
 * These witness names require the organizer's secret key
 */
const IDENTITY_ALIASES = [
  'local_sk',
  'local_secret_key',
  'organizer_key',
  'set_owner_from_local_sk',
];

/**
 * Sensitive witness names that indicate organizer-only access
 */
const SENSITIVE_WITNESSES = new Set([
  'local_sk',
  'set_owner_from_local_sk',
  'compute_commitment_with_secret',
  'check_pin',
]);

/**
 * State-modifying prefixes that often indicate organizer-only operations
 */
const STATE_MODIFYING_PREFIXES = [
  'set',
  'toggle',
  'update',
  'change',
  'modify',
  'admin',
  'register',
  'initialize',
  'configure',
  'manage',
];

/**
 * Detects organizer-only circuits using heuristic pattern analysis.
 *
 * Strategy:
 * - Analyzes circuit naming patterns (e.g., set*, toggle*, update*)
 * - Checks for presence of sensitive witnesses in the contract
 * - Marks circuits as organizer-only if they match both criteria
 *
 * This approach is reliable because:
 * 1. Contracts typically follow naming conventions for state-mutating functions
 * 2. Sensitive witnesses (local_sk, set_owner_from_local_sk) are only present when needed
 * 3. The combination of both signals high confidence
 *
 * @param circuitMap - Map of circuit IDs from contract.impureCircuits
 * @param witnesses - Loaded witness functions
 * @returns Map of circuit ID to organizer-only status
 */
export function detectOrganizerOnlyCircuits(
  circuitMap: Record<string, unknown>,
  witnesses: Record<string, unknown>
): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  // Check if sensitive witnesses are available
  const hasSensitiveWitnesses = Array.from(SENSITIVE_WITNESSES).some((name) => name in witnesses);

  if (!hasSensitiveWitnesses) {
    logger.debug(SYSTEM_LOG_TAG, 'No sensitive witnesses found; all circuits treated as public');
    return results;
  }

  logger.debug(
    SYSTEM_LOG_TAG,
    `Analyzing ${Object.keys(circuitMap).length} circuits with heuristic detection`
  );

  for (const [circuitId] of Object.entries(circuitMap)) {
    const isOrganizerOnly = isLikelyOrganizerOnly(circuitId, witnesses);
    if (isOrganizerOnly) {
      results[circuitId] = true;
      logger.debug(SYSTEM_LOG_TAG, `Circuit "${circuitId}" identified as organizer-only`);
    }
  }

  const organizerOnlyCount = Object.values(results).filter(Boolean).length;
  logger.info(
    SYSTEM_LOG_TAG,
    `Detection complete: ${organizerOnlyCount} organizer-only circuits identified`
  );

  return results;
}

/**
 * Heuristic check for organizer-only circuits based on naming patterns
 *
 * @param circuitId - The circuit identifier
 * @param witnesses - Available witness functions
 * @returns True if circuit is likely organizer-only
 */
function isLikelyOrganizerOnly(circuitId: string, witnesses: Record<string, unknown>): boolean {
  // Check if circuit name starts with a state-modifying prefix
  const lowerCircuitId = circuitId.toLowerCase();
  const hasModifyingPrefix = STATE_MODIFYING_PREFIXES.some((prefix) =>
    lowerCircuitId.startsWith(prefix)
  );

  if (!hasModifyingPrefix) {
    return false;
  }

  // Double-check that sensitive witnesses are available
  // (should always be true if called from detectOrganizerOnlyCircuits, but belt-and-suspenders)
  const hasSensitiveWitnesses = Array.from(SENSITIVE_WITNESSES).some((name) => name in witnesses);

  // Mark as organizer-only if it has a modifying name pattern AND sensitive witnesses exist
  return hasModifyingPrefix && hasSensitiveWitnesses;
}

/**
 * Detects organizer-only circuits by scanning compiled circuit implementations for identity-witness calls.
 *
 * Strategy:
 * - For each impure circuit, extract the implementation function text
 * - Search for calls to identity-witness functions (local_sk, organizer_key, etc.)
 * - Check for both direct calls (this.witnesses.local_sk()) and destructured patterns
 * - More accurate than naming heuristics; avoids runtime execution
 *
 * @param impureCircuits - Map of circuit IDs to their implementations
 * @param witnesses - Loaded witness functions
 * @returns Map of circuit ID to organizer-only status
 */
export function detectOrganizerOnlyBySource(
  impureCircuits: Record<string, unknown>,
  witnesses: Record<string, unknown>,
  contractInstance?: Record<string, unknown>
): Record<string, boolean> {
  const results: Record<string, boolean> = {};

  // Quick check: if no identity witnesses are present, no circuit needs organizer key
  const hasIdentityWitnesses = IDENTITY_ALIASES.some((alias) => alias in witnesses);

  if (!hasIdentityWitnesses) {
    logger.debug(
      SYSTEM_LOG_TAG,
      'No identity witnesses found; all circuits treated as non-organizer-only'
    );
    return results;
  }

  logger.debug(
    SYSTEM_LOG_TAG,
    `Analyzing ${Object.keys(impureCircuits).length} circuits by source inspection`
  );

  for (const [circuitId, circuitFn] of Object.entries(impureCircuits)) {
    if (callsIdentityWitness(circuitFn, circuitId, contractInstance)) {
      results[circuitId] = true;
      logger.debug(
        SYSTEM_LOG_TAG,
        `Circuit "${circuitId}" uses identity witness (source inspection)`
      );
    }
  }

  const organizerOnlyCount = Object.values(results).filter(Boolean).length;
  logger.info(
    SYSTEM_LOG_TAG,
    `Source inspection complete: ${organizerOnlyCount} organizer-only circuits identified`
  );

  return results;
}

/**
 * Checks if a circuit implementation calls any identity witness, directly or via helper methods
 */
function callsIdentityWitness(
  circuitFn: unknown,
  circuitId: string,
  contractInstance?: Record<string, unknown>,
  visited: Set<string> = new Set<string>(),
  depth: number = 0
): boolean {
  if (typeof circuitFn !== 'function') {
    return false;
  }

  try {
    const src = circuitFn.toString();
    if (!src || src.length === 0) {
      return false;
    }

    // Direct witness calls
    const directPattern = IDENTITY_ALIASES.some(
      (alias) => src.includes(`this.witnesses.${alias}(`) || src.includes(`.witnesses.${alias}(`)
    );

    if (directPattern) {
      return true;
    }

    // Destructured witness access
    const destructPattern = IDENTITY_ALIASES.some((alias) => {
      const hasDestructure = src.includes(`{ ${alias} }`) && src.includes(`this.witnesses`);
      const hasUsage = src.includes(`${alias}(`);
      return hasDestructure && hasUsage;
    });

    if (destructPattern) {
      return true;
    }

    // Recursive scan of helper methods referenced in the function body
    if (contractInstance && depth < 6) {
      const helperNames = extractHelperCalls(src);
      for (const helperName of helperNames) {
        if (visited.has(helperName)) continue;
        visited.add(helperName);
        const helperFn = contractInstance[helperName];
        if (typeof helperFn === 'function') {
          if (
            callsIdentityWitness(
              helperFn as unknown as () => unknown,
              helperName,
              contractInstance,
              visited,
              depth + 1
            )
          ) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    logger.debug(
      SYSTEM_LOG_TAG,
      `Could not inspect source for circuit ${circuitId}:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Extract helper method names called on `this` within a function source.
 * Matches patterns like: this._helperName( ... )
 */
function extractHelperCalls(source: string): Set<string> {
  const names = new Set<string>();
  const regex = /this\.([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    // skip obvious non-helpers
    if (name === 'witnesses' || name === 'circuits' || name === 'pureCircuits') continue;
    names.add(name);
  }
  return names;
}
