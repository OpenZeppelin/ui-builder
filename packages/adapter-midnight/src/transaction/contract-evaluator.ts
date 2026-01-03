import { logger } from '@openzeppelin/ui-utils';

const SYSTEM_LOG_TAG = 'ContractEvaluator';

/**
 * Evaluates user-provided contract module code and creates a contract instance
 * Pattern: mirrors CLI's dynamic contract module loading
 *
 * @param contractModule - The contract module code (CommonJS format)
 * @param witnesses - Witness functions for zero-knowledge proofs
 * @param deps - Optional dependency map to inject specific modules (e.g., compact-runtime)
 */
export function evaluateContractModule(
  contractModule: string,
  witnesses: Record<string, unknown>,
  deps?: Record<string, unknown>
): unknown {
  if (!contractModule || contractModule.trim() === '') {
    throw new Error('Contract module code is required for transaction execution');
  }

  try {
    logger.debug(SYSTEM_LOG_TAG, 'Evaluating contract module');

    // Pre-process the contract module to fix multi-line statement issues
    // TEMPORARY WORKAROUND: The Midnight compiler sometimes outputs multi-line
    // chained calls that break Function() parsing. This joins them back together.
    // Waiting for Midnight SDK compiler improvements to output Function()-compatible code.
    let processedModule = contractModule;

    // Fix all multi-line chained method calls - join lines that start with a dot
    processedModule = processedModule.replace(/\n\s*\./g, '.');

    // Also fix multi-line array/object access
    processedModule = processedModule.replace(/\n\s*\[/g, '[');

    // Contract modules are CommonJS format: module.exports = { Contract: ... }
    // Create a sandboxed environment for evaluation
    const moduleExports = {};
    const sandbox = {
      module: { exports: moduleExports },
      exports: moduleExports,
      require: function (id: string) {
        logger.debug(SYSTEM_LOG_TAG, `Contract requires module: ${id}`);
        // Priority 1: Use injected deps to guarantee shared runtime instances
        if (deps && id in deps) {
          logger.debug(SYSTEM_LOG_TAG, `Module ${id} loaded from injected deps`);
          const mod = (deps as Record<string, unknown>)[id];
          // Unwrap ESM default for CJS consumers to fix interop issues
          return (mod as Record<string, unknown>)?.default ?? mod;
        }
        // Priority 2: Use global require if available
        if (globalThis.require) {
          const result = globalThis.require(id);
          logger.debug(
            SYSTEM_LOG_TAG,
            `Module ${id} loaded:`,
            result ? 'success' : 'null/undefined'
          );
          return result;
        }
        throw new Error('require is not available for module: ' + id);
      },
      process: {
        env: { NODE_ENV: 'production' },
        version: 'v16.0.0',
        versions: {
          node: '16.0.0',
          v8: '9.0.0',
          modules: '93',
        },
        platform: 'browser',
        arch: 'wasm32',
        release: {
          name: 'node',
          lts: 'Gallium',
        },
      },
      global: globalThis,
      globalThis: globalThis,
      __dirname: '/',
      __filename: '/contract.cjs',
      console: console,
      Buffer: globalThis.Buffer || {
        from: (data: string | Uint8Array, encoding?: string) => {
          let uint8Array: Uint8Array;
          if (typeof data === 'string') {
            if (encoding === 'hex') {
              const bytes = [];
              for (let i = 0; i < data.length; i += 2) {
                bytes.push(parseInt(data.substring(i, i + 2), 16));
              }
              uint8Array = new Uint8Array(bytes);
            } else {
              uint8Array = new TextEncoder().encode(data);
            }
          } else {
            uint8Array = new Uint8Array(data as Uint8Array);
          }
          // Add toString method to convert back to hex
          (uint8Array as Uint8Array & { toString(encoding?: string): string }).toString = (
            encoding?: string
          ) => {
            if (encoding === 'hex') {
              return Array.from(uint8Array)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
            }
            return new TextDecoder().decode(uint8Array);
          };
          return uint8Array;
        },
        alloc: (size: number) => new Uint8Array(size),
        isBuffer: (obj: unknown) => obj instanceof Uint8Array,
      },
      witnesses: witnesses,
    };

    // Create the evaluator function with the sandbox
    const evaluator = new Function(
      ...Object.keys(sandbox),
      processedModule + '\nreturn module.exports;'
    );

    // Call the evaluator with the sandbox values
    const contractExports = evaluator(...Object.values(sandbox));

    logger.debug(
      SYSTEM_LOG_TAG,
      `Contract exports → type:${typeof contractExports} keys:${
        contractExports ? Object.keys(contractExports).join(',') : 'null'
      }`
    );

    if (!contractExports || typeof contractExports !== 'object') {
      throw new Error('Contract module did not export a valid object');
    }

    if (typeof contractExports.Contract !== 'function') {
      logger.error(SYSTEM_LOG_TAG, 'Available exports:', Object.keys(contractExports));
      logger.error(SYSTEM_LOG_TAG, 'Contract property type:', typeof contractExports.Contract);
      logger.error(SYSTEM_LOG_TAG, 'Contract property value:', contractExports.Contract);
      logger.error(
        SYSTEM_LOG_TAG,
        'Contract constructor check:',
        contractExports.Contract?.constructor?.name
      );
      throw new Error('Contract module does not export a Contract class');
    }

    logger.debug(SYSTEM_LOG_TAG, 'Creating contract instance with witnesses');
    const contractInstance = new contractExports.Contract(witnesses);

    logger.info(SYSTEM_LOG_TAG, 'Contract instance created');
    return contractInstance;
  } catch (error) {
    logger.error(SYSTEM_LOG_TAG, 'Failed to evaluate contract module:', error);
    throw new Error(
      `Failed to create contract instance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
