import { Buffer } from 'buffer';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

import type { ContractSchema } from '@openzeppelin/ui-builder-types';
import { logger, withTimeout } from '@openzeppelin/ui-builder-utils';

import { validateContractAddress } from '../validation/address';

/**
 * Default timeout for query operations in milliseconds (30 seconds)
 */
export const DEFAULT_QUERY_TIMEOUT = 30000;

/**
 * Error thrown when contract state cannot be queried
 */
export class ContractQueryError extends Error {
  constructor(
    message: string,
    public readonly contractAddress: string,
    public readonly functionId?: string
  ) {
    super(message);
    this.name = 'ContractQueryError';
  }
}

/**
 * Browser-safe QueryExecutor for read-only contract queries.
 * Handles contract state reads via Midnight providers with timeout support.
 *
 * Rationale:
 * - EVM and Stellar adapters expose only functional handlers; Midnight requires extra orchestration.
 * - This class encapsulates Midnight-specific concerns that benefit from stateful caching:
 *   - Dynamic ledger() loading from the compiled contract module and reuse across calls
 *   - Heterogeneous state fetch/deserialization (raw hex vs pre-deserialized objects)
 *   - Network ID coordination for compact-runtime deserialization
 *   - Consistent timeout handling and structured error reporting
 * Keeping these concerns localized preserves a functional public boundary
 * (queryMidnightViewFunction) while isolating chain-specific complexity for maintainability.
 */
export class QueryExecutor {
  private readonly contractAddressHex: string;
  private readonly contractAddressBech32: string;
  private readonly schema: ContractSchema;
  private readonly providers: MidnightProviders;
  private readonly timeout: number;
  private readonly contractModule?: string;
  private readonly numericNetworkId?: number;
  private ledgerFunction?: (state: unknown) => unknown;
  // Maximum allowed size (approximate, in characters) for compiled contract module code
  private static readonly MAX_MODULE_CODE_SIZE = 2_000_000;

  /**
   * Create a new QueryExecutor instance
   *
   * @param contractAddress Hex-encoded contract address (68 chars, starts with 0200)
   * @param schema Contract schema
   * @param providers Midnight providers
   * @param timeout Query timeout in milliseconds (defaults to 30 seconds)
   * @param contractModule Optional compiled contract module code (for ledger() access)
   */
  constructor(
    contractAddress: string,
    schema: ContractSchema,
    providers: MidnightProviders,
    timeout: number = DEFAULT_QUERY_TIMEOUT,
    contractModule?: string,
    numericNetworkId?: number
  ) {
    // Validate the contract address
    const validation = validateContractAddress(contractAddress);
    if (!validation.isValid) {
      throw new ContractQueryError(
        `Invalid contract address: ${validation.error}`,
        contractAddress
      );
    }

    // Midnight addresses are already in hex format (68-char hex starting with 0200)
    this.contractAddressHex = validation.normalized!;
    this.contractAddressBech32 = validation.normalized!; // Same as hex for Midnight
    this.schema = schema;
    this.providers = providers;
    this.timeout = timeout;
    this.contractModule = contractModule;
    this.numericNetworkId = numericNetworkId;

    logger.debug('QueryExecutor', `Initialized for contract: ${this.contractAddressHex}`);
  }

  /**
   * Execute a query against the contract
   *
   * @param functionId The function ID to query
   * @param params Parameters for the query (if any)
   * @param timeoutMs Optional custom timeout in milliseconds
   * @returns The query result
   * @throws {ContractQueryError} if the query fails or times out
   */
  async call(functionId: string, params: unknown[] = [], timeoutMs?: number): Promise<unknown> {
    const effectiveTimeout = timeoutMs || this.timeout;

    logger.debug(
      'QueryExecutor',
      `Executing query: ${functionId} with ${params.length} parameter(s), timeout ${effectiveTimeout}ms`
    );

    try {
      // Find the function in the schema
      const func = this.schema.functions.find((f) => f.id === functionId);
      if (!func) {
        throw new ContractQueryError(
          `Function '${functionId}' not found in contract schema`,
          this.contractAddressBech32,
          functionId
        );
      }

      // Verify it's a view function
      if (func.modifiesState) {
        throw new ContractQueryError(
          `Function '${functionId}' is not a view function (modifies state)`,
          this.contractAddressBech32,
          functionId
        );
      }

      // Execute the query with timeout
      const queryPromise = this.executeQuery(func.name, params);
      const result = await withTimeout(queryPromise, effectiveTimeout, `Query '${functionId}'`);

      logger.debug('QueryExecutor', `Query completed: ${functionId}`);
      return result;
    } catch (error) {
      if (error instanceof ContractQueryError) {
        throw error;
      }

      // Wrap other errors (including timeout errors)
      throw new ContractQueryError(
        `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.contractAddressBech32,
        functionId
      );
    }
  }

  /**
   * Internal method to execute the actual query
   *
   * @param methodName Name of the method to query
   * @param params Parameters for the query
   * @returns The query result
   */
  private async executeQuery(methodName: string, params: unknown[]): Promise<unknown> {
    try {
      logger.debug(
        'QueryExecutor',
        `Querying contract state for address: ${this.contractAddressHex}, method: ${methodName}, params:`,
        params
      );
      await this.logCurrentNetwork();
      const queryResult = await this.fetchContractState();

      if (!queryResult) {
        throw new ContractQueryError(
          `Contract not found at address ${this.contractAddressBech32}. ` +
            `Please verify the contract is deployed on this network and the address is correct.`,
          this.contractAddressBech32
        );
      }

      const contractState = await this.deserializeContractStateIfNeeded(queryResult);

      // Extract the state data from ContractState
      // ContractState.query() requires CostModel/circuits, so we access data directly
      const stateData =
        contractState && typeof contractState === 'object' && 'data' in contractState
          ? contractState.data
          : undefined;
      logger.debug('QueryExecutor', `Extracted state data:`, stateData);

      if (!stateData) {
        throw new ContractQueryError(
          `No state data found in contract at ${this.contractAddressBech32}`,
          this.contractAddressBech32
        );
      }

      await this.ensureLedgerFunctionLoaded();

      const ledgerState = this.getLedgerState(stateData);
      const result = this.getFieldOrCallMethodFromLedgerState(ledgerState, methodName, params);
      logger.debug('QueryExecutor', `Extracted field '${methodName}':`, result);

      // Convert to JSON-serializable format
      return this.convertValueToSerializable(result);
    } catch (error) {
      if (error instanceof ContractQueryError) {
        throw error;
      }

      // Provide more helpful error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : 'Unknown error';

      throw new ContractQueryError(
        `Failed to query contract state: ${errorMessage}. ` +
          `Ensure the contract is deployed at ${this.contractAddressBech32} on the selected network.`,
        this.contractAddressBech32
      );
    }
  }

  /**
   * Convert a value to a JSON-serializable format
   *
   * Handles common Midnight types:
   * - bigint -> string (for JSON serialization)
   * - Uint8Array/Buffer -> hex string
   * - Complex objects -> deep conversion
   *
   * @param value The value to convert
   * @returns JSON-serializable value
   */
  private convertValueToSerializable(value: unknown): unknown {
    // Handle primitives
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle bigint (convert to string for JSON serialization)
    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Handle Uint8Array/Buffer (convert to hex)
    if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
      return '0x' + Buffer.from(value).toString('hex');
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.convertValueToSerializable(item));
    }

    // Handle objects
    if (typeof value === 'object') {
      // Check if it's a WASM object
      if ('__wbg_ptr' in value) {
        // Try toJSON first
        if ('toJSON' in value && typeof value.toJSON === 'function') {
          return this.convertValueToSerializable(value.toJSON());
        }

        // Try to get properties from the prototype
        const proto = Object.getPrototypeOf(value);
        const getters = Object.entries(Object.getOwnPropertyDescriptors(proto))
          .filter(
            ([key, descriptor]) => typeof descriptor.get === 'function' && !key.startsWith('__')
          )
          .map(([key]) => key);

        if (getters.length > 0) {
          const result: Record<string, unknown> = {};
          for (const key of getters) {
            try {
              // Call the getter
              const val = (value as Record<string, unknown>)[key];
              result[key] = this.convertValueToSerializable(val);
            } catch (e) {
              logger.debug('QueryExecutor', `Failed to get property '${key}':`, e);
            }
          }
          return result;
        }
      }

      // Regular object
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Skip internal properties (e.g., __wbg_ptr from WASM objects)
        if (key.startsWith('__')) {
          continue;
        }
        result[key] = this.convertValueToSerializable(val);
      }
      return result;
    }

    // Fallback: try to stringify
    try {
      return String(value);
    } catch {
      return '[Unserializable Value]';
    }
  }

  /**
   * Logs current network ID information for traceability
   */
  private async logCurrentNetwork(): Promise<void> {
    const { getNetworkId, networkIdToHex } = await import('@midnight-ntwrk/midnight-js-network-id');
    const currentNetworkId = getNetworkId();
    const currentNetworkIdHex = networkIdToHex(currentNetworkId);
    logger.debug(
      'QueryExecutor',
      `Current network ID: ${currentNetworkId} (hex: ${currentNetworkIdHex})`
    );
  }

  /**
   * Fetches raw contract state from the provider
   */
  private async fetchContractState(): Promise<unknown> {
    const result = await this.providers.publicDataProvider.queryContractState(
      this.contractAddressHex
    );
    logger.debug('QueryExecutor', `Received query result:`, result);
    return result;
  }

  /**
   * Deserializes contract state when the provider returns a raw hex payload
   */
  private async deserializeContractStateIfNeeded(raw: unknown): Promise<unknown> {
    const looksLikeHexState =
      typeof raw === 'object' &&
      raw !== null &&
      'state' in (raw as Record<string, unknown>) &&
      typeof (raw as Record<string, unknown>).state === 'string';

    if (!looksLikeHexState) {
      logger.debug('QueryExecutor', `Using pre-deserialized ContractState:`, raw);
      return raw;
    }

    const hex = (raw as Record<string, string>).state;
    logger.debug('QueryExecutor', `Deserializing state from hex:`, hex.substring(0, 50) + '...');

    const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
    const numericNetworkId = this.numericNetworkId ?? (await this.getNumericNetworkId());

    const stateBytes = Buffer.from(hex, 'hex');
    const deserialized = ContractState.deserialize(stateBytes, numericNetworkId);
    logger.debug('QueryExecutor', `Deserialized ContractState:`, deserialized);
    return deserialized;
  }

  /**
   * Resolves the numeric network ID used by compact-runtime
   */
  private async getNumericNetworkId(): Promise<number> {
    const { getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
    const networkId = getNetworkId();
    if (networkId === 'MainNet') return 3;
    if (networkId === 'DevNet') return 1;
    if (networkId === 'Undeployed') return 0;
    return 2; // Default to TestNet
  }

  /**
   * Ensures the ledger() function is loaded before use
   */
  private async ensureLedgerFunctionLoaded(): Promise<void> {
    if (this.ledgerFunction) return;

    if (!this.contractModule) {
      throw new ContractQueryError(
        `Contract module is required to query Midnight contracts. ` +
          `Please provide the compiled contract module (.cjs file) when loading the contract.`,
        this.contractAddressBech32
      );
    }

    this.ledgerFunction = await this.loadLedgerFunction(this.contractModule);
    logger.debug('QueryExecutor', 'Ledger function loaded successfully');
  }

  /**
   * Returns the ledger object produced by ledger(stateData)
   */
  private getLedgerState(stateData: unknown): Record<string, unknown> {
    const ledgerState = this.ledgerFunction ? this.ledgerFunction(stateData) : undefined;
    if (!ledgerState || typeof ledgerState !== 'object') {
      throw new ContractQueryError(
        `ledger() function returned invalid state for contract at ${this.contractAddressBech32}`,
        this.contractAddressBech32
      );
    }
    return ledgerState as Record<string, unknown>;
  }

  /**
   * Safely selects a field or calls a method from the ledger state, with helpful error messages.
   * For parameterless queries, returns the field value directly.
   * For queries with parameters, invokes the method if it's a function.
   */
  private getFieldOrCallMethodFromLedgerState(
    ledgerState: Record<string, unknown>,
    methodName: string,
    params: unknown[]
  ): unknown {
    if (!(methodName in ledgerState)) {
      throw new ContractQueryError(
        `Field '${methodName}' not found in contract state. ` +
          `Available fields: ${Object.keys(ledgerState).join(', ')}`,
        this.contractAddressBech32
      );
    }

    const field = ledgerState[methodName];

    // If no params and field is not a function, return directly
    if (params.length === 0 && typeof field !== 'function') {
      return field;
    }

    // If params provided, field must be a function
    if (params.length > 0 && typeof field !== 'function') {
      throw new ContractQueryError(
        `Field '${methodName}' is not a function but parameters were provided. ` +
          `Cannot call a non-function field with parameters.`,
        this.contractAddressBech32
      );
    }

    // If field is a function, call it with params
    if (typeof field === 'function') {
      try {
        return field(...params);
      } catch (error) {
        throw new ContractQueryError(
          `Failed to call method '${methodName}' with parameters: ${error instanceof Error ? error.message : 'Unknown error'}`,
          this.contractAddressBech32
        );
      }
    }

    // Default: return the field value
    return field;
  }
  /**
   * Loads the ledger() function from the compiled contract module.
   *
   * Limitation: compiled helpers must match the compact-runtime version bundled
   * with the app. Consider multi-version runtime support for broader compatibility.
   *
   * @param moduleCode The compiled contract module code (CommonJS format)
   * @returns The ledger function
   * @throws Error if the ledger function cannot be loaded
   */
  private async loadLedgerFunction(moduleCode: string): Promise<(state: unknown) => unknown> {
    try {
      // Validate the module code before evaluation to reduce risk of executing untrusted input.
      this.validateContractModuleCode(moduleCode);

      // Import the compact-runtime dependency that the contract module needs
      const compactRuntime = await import('@midnight-ntwrk/compact-runtime');

      // Create a module exports object to capture the exports
      const moduleExports: Record<string, unknown> = {};
      const moduleObj = { exports: moduleExports };

      // Create a Function constructor to evaluate the module code in a controlled scope
      // This is safer than eval() as it doesn't have access to the local scope
      const func = new Function('module', 'exports', 'require', moduleCode);

      // Create a require function that provides runtime dependencies
      const requireFunc = (id: string) => {
        if (id === '@midnight-ntwrk/compact-runtime') {
          // ES modules from dynamic import have exports as properties
          // CommonJS expects them directly on the returned object
          return 'default' in compactRuntime ? compactRuntime.default : compactRuntime;
        }

        // For other dependencies, return empty object (ledger typically only needs compact-runtime)
        logger.debug('QueryExecutor', `Unknown dependency required: ${id}, returning empty object`);
        return {};
      };

      // Execute the module code
      func(moduleObj, moduleExports, requireFunc);

      // Extract the ledger function from exports
      const exports = moduleObj.exports;
      const ledger =
        ('ledger' in exports && exports.ledger) ||
        ('default' in exports &&
          typeof exports.default === 'object' &&
          exports.default !== null &&
          'ledger' in exports.default &&
          exports.default.ledger);

      if (!ledger || typeof ledger !== 'function') {
        throw new Error('ledger() function not found in contract module exports');
      }

      return ledger as (state: unknown) => unknown;
    } catch (error) {
      logger.error('QueryExecutor', 'Failed to load ledger function:', error);
      throw new Error(
        `Failed to load ledger() function from contract module: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Performs basic validation of the compiled contract module code before evaluation.
   *
   * Security rationale:
   * - The module code should come from a trusted source (e.g., user-provided artifacts).
   * - We block usage of obvious dangerous globals/APIs (eval, Function constructor, DOM, fetch, etc.).
   * - This is defense-in-depth and does not replace sandboxing or CSP.
   *
   * Consider enforcing a strict Content Security Policy (CSP) and/or evaluating in a sandboxed iframe
   * if additional isolation is required for your deployment environment.
   */
  private validateContractModuleCode(moduleCode: string): void {
    // Size guard (approximate; JS strings are UTF-16)
    if (moduleCode.length > QueryExecutor.MAX_MODULE_CODE_SIZE) {
      throw new ContractQueryError(
        'Contract module code is too large to be evaluated safely',
        this.contractAddressBech32
      );
    }

    // Expected markers for Midnight compiled modules
    if (!moduleCode.includes('@midnight-ntwrk/compact-runtime') || !moduleCode.includes('ledger')) {
      logger.warn(
        'QueryExecutor',
        'Contract module code is missing expected markers; continuing with caution'
      );
    }

    // Block obvious dangerous globals/APIs from being referenced
    const blockedPatterns: RegExp[] = [
      /\beval\s*\(/,
      /\bFunction\s*\(/,
      /\bwindow\./,
      /\bdocument\./,
      /\bXMLHttpRequest\b/,
      /\bfetch\s*\(/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bnavigator\./,
      /\bglobalThis\./,
      /\bWebSocket\b/,
    ];

    const hits = blockedPatterns.filter((re) => re.test(moduleCode));
    if (hits.length > 0) {
      throw new ContractQueryError(
        `Contract module uses disallowed globals/APIs (${hits
          .map((r) => r.source)
          .join(', ')}); aborting evaluation`,
        this.contractAddressBech32
      );
    }
  }
}
