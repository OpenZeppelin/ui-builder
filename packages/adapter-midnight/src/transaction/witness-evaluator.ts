import { logger } from '@openzeppelin/ui-builder-utils';

const SYSTEM_LOG_TAG = 'WitnessEvaluator';

/**
 * Evaluates user-provided witness code and extracts witness functions
 * Pattern: mirrors WitnessManager from deploy CLI
 *
 * Security note: Uses Function() constructor to evaluate user code.
 * This is intentional to match CLI behavior and enable dynamic witness loading.
 */
export function evaluateWitnessCode(witnessCode: string): Record<string, unknown> {
  if (!witnessCode || witnessCode.trim() === '') {
    logger.debug(SYSTEM_LOG_TAG, 'No witness code provided, using empty witnesses');
    return {};
  }

  try {
    logger.debug(SYSTEM_LOG_TAG, 'Evaluating witness code');

    // Sanitize ESM syntax so it evaluates in a Function (non-module) context
    const sanitized = sanitizeWitnessCode(witnessCode);

    // Create a sandboxed environment for witness evaluation
    // Witnesses are pure functions that don't need external dependencies,
    // but we sandbox them for consistency and to prevent unintended global access
    const sandbox = {
      console: console, // Allow logging for debugging
      // Witnesses don't need require, Buffer, or other globals
      // They're called with context at runtime by the contract
    };

    // Create the evaluator function with the sandbox
    const evaluator = new Function(...Object.keys(sandbox), sanitized + '\nreturn witnesses;');

    // Call the evaluator with the sandbox values
    const witnesses = evaluator(...Object.values(sandbox));

    if (typeof witnesses !== 'object' || witnesses === null) {
      logger.warn(SYSTEM_LOG_TAG, 'Witness code did not export valid witnesses object');
      return {};
    }

    const witnessCount = Object.keys(witnesses).length;
    logger.info(SYSTEM_LOG_TAG, `Loaded ${witnessCount} witness functions`);
    if (witnessCount > 0) {
      Object.keys(witnesses).forEach((name) => {
        logger.debug(SYSTEM_LOG_TAG, `- ${name}`);
      });
    }

    return witnesses as Record<string, unknown>;
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to evaluate witness code:', error);
    throw new Error(
      `Failed to evaluate witness functions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Remove ESM-specific syntax so the code can run inside Function().
 * - Replace `export const witnesses =` with `const witnesses =`
 * - Remove `export default ...` and `export { ... }` lines
 * - Remove/ignore top-level `import ... from` statements (not supported in Function context)
 *
 * TEMPORARY WORKAROUND: This regex-based sanitization is pragmatic but brittle.
 * Waiting for Midnight SDK to provide witnesses in CommonJS format or provide
 * a proper loader. Long-term, replace with AST-based transformation (esbuild/swc)
 * for more robust handling of edge cases.
 */
function sanitizeWitnessCode(code: string): string {
  let out = code;

  // Normalize Windows newlines
  out = out.replace(/\r\n/g, '\n');

  // Remove top-level import statements (simple cases)
  out = out.replace(/^\s*import\s+[^;]+;?\s*$/gm, '');

  // Replace exported declaration of witnesses with non-exported
  out = out.replace(/\bexport\s+(const|let|var)\s+(witnesses)\b/g, '$1 $2');

  // Remove `export { witnesses }` or any named export lines
  out = out.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');

  // Remove `export default ...` lines (we rely on `witnesses` identifier instead)
  out = out.replace(/^\s*export\s+default\s+[^;]+;?\s*$/gm, '');

  // As a last resort, strip remaining leading `export ` keywords on declarations
  out = out.replace(/^\s*export\s+/gm, '');

  return out;
}
