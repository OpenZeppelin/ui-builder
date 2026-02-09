/**
 * Access Control Integration Tests for EVM Adapter
 *
 * Tests the full integration path: EvmAdapter.getAccessControlService() → registerContract()
 * → getCapabilities() → getOwnership() → transferOwnership() with mocked RPC and indexer.
 *
 * Verifies:
 * - Lazy initialization (NFR-004): first call creates service, second returns same instance
 * - Service interface: all AccessControlService methods are exposed
 * - Callback wiring: executeTransaction wraps signAndBroadcast correctly
 * - Full flow: register → detect → read → write with mocked infrastructure
 *
 * @see SC-008 — comprehensive test coverage
 * @see quickstart.md §Step 9 — Adapter Integration
 * @see research.md §R9 — Service Lifecycle and Transaction Execution
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  EvmAccessControlService,
  TypedEvmNetworkConfig,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type {
  AccessControlService,
  ContractFunction,
  ContractSchema,
  ExecutionConfig,
} from '@openzeppelin/ui-types';

// ---------------------------------------------------------------------------
// Import adapter AFTER mocks are set up (vitest hoists vi.mock)
// ---------------------------------------------------------------------------

import { EvmAdapter } from '../src/adapter';

// ---------------------------------------------------------------------------
// Mock viem for RPC calls (shared by both adapter-evm and adapter-evm-core)
// ---------------------------------------------------------------------------

const mockReadContract = vi.fn();
const mockGetBlockNumber = vi.fn();

vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
      getBlockNumber: mockGetBlockNumber,
    })),
    http: vi.fn((url: string) => ({ url, type: 'http' })),
  };
});

// ---------------------------------------------------------------------------
// Mock wallet and UI modules to avoid real wallet/React dependencies
// ---------------------------------------------------------------------------

vi.mock('../src/wallet/hooks/useUiKitConfig', () => ({
  loadInitialConfigFromAppService: () => ({ kitName: 'custom' }),
}));

vi.mock('../src/wallet/components/EvmWalletUiRoot', () => ({
  EvmWalletUiRoot: undefined,
}));

vi.mock('../src/wallet/evmUiKitManager', () => ({
  evmUiKitManager: {
    getState: () => ({ currentFullUiKitConfig: null }),
    configure: vi.fn(),
  },
}));

vi.mock('../src/wallet/hooks/facade-hooks', () => ({
  evmFacadeHooks: {},
}));

vi.mock('../src/wallet', () => ({
  getEvmWalletImplementation: vi.fn().mockResolvedValue({
    writeContract: vi.fn().mockResolvedValue('0xmocktxhash'),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
  }),
  evmSupportsWalletConnection: () => false,
  getEvmWalletConnectionStatus: () => ({ status: 'disconnected' }),
  getEvmAvailableConnectors: vi.fn().mockResolvedValue([]),
  connectAndEnsureCorrectNetwork: vi.fn(),
  disconnectEvmWallet: vi.fn(),
  convertWagmiToEvmStatus: () => ({ status: 'disconnected' }),
  getInitializedEvmWalletImplementation: () => null,
  getResolvedWalletComponents: () => undefined,
  EvmWalletConnectionStatus: {},
}));

// Mock query module (only used by queryViewFunction, not needed for AC tests)
vi.mock('../src/query', () => ({
  queryEvmViewFunction: vi.fn(),
}));

// Mock transaction module
vi.mock('../src/transaction', () => ({
  EvmRelayerOptions: undefined,
}));

// Mock configuration module
vi.mock('../src/configuration', () => ({
  getEvmDefaultServiceConfig: () => null,
  getEvmNetworkServiceForms: () => [],
  getEvmSupportedExecutionMethods: vi.fn().mockResolvedValue([]),
}));

// ---------------------------------------------------------------------------
// Mock global fetch for indexer GraphQL calls
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFunction(name: string, inputTypes: string[] = []): ContractFunction {
  return {
    id: name,
    name,
    displayName: name,
    type: 'function',
    inputs: inputTypes.map((type, i) => ({ name: `param${i}`, type })),
    outputs: [],
    modifiesState: false,
    stateMutability: 'view',
  };
}

function createSchema(functions: ContractFunction[]): ContractSchema {
  return {
    name: 'TestContract',
    ecosystem: 'evm',
    address: '0x1234567890123456789012345678901234567890',
    functions,
    events: [],
  };
}

/** Network config for integration tests */
const TEST_NETWORK_CONFIG = {
  id: 'ethereum-sepolia',
  exportConstName: 'ethereumSepolia',
  name: 'Sepolia',
  ecosystem: 'evm',
  network: 'ethereum',
  type: 'testnet',
  isTestnet: true,
  chainId: 11155111,
  rpcUrl: 'https://rpc.sepolia.example.com',
  explorerUrl: 'https://sepolia.etherscan.io',
  apiUrl: 'https://api.etherscan.io/v2/api',
  primaryExplorerApiIdentifier: 'etherscan-v2',
  supportsEtherscanV2: true,
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  accessControlIndexerUrl: 'https://openzeppelin-ethereum-sepolia.graphql.subquery.network/',
} as TypedEvmNetworkConfig;

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
const OWNER_ADDRESS = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';
const NEW_OWNER_ADDRESS = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Ownable2Step ABI functions for feature detection */
const OWNABLE_TWO_STEP_FUNCTIONS = [
  createFunction('owner', []),
  createFunction('pendingOwner', []),
  { ...createFunction('transferOwnership', ['address']), modifiesState: true },
  { ...createFunction('acceptOwnership', []), modifiesState: true },
  { ...createFunction('renounceOwnership', []), modifiesState: true },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EvmAdapter — Access Control Integration', () => {
  let adapter: EvmAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new EvmAdapter(TEST_NETWORK_CONFIG);

    // Setup global fetch mock for indexer
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Lazy Initialization (NFR-004)
  // -------------------------------------------------------------------------

  /** Helper to get the service cast to EvmAccessControlService for EVM-specific methods */
  function getEvmService(): EvmAccessControlService {
    return adapter.getAccessControlService() as EvmAccessControlService;
  }

  describe('lazy initialization (NFR-004)', () => {
    it('should return an AccessControlService on first call', () => {
      const service = getEvmService();

      expect(service).toBeDefined();
      expect(typeof service.registerContract).toBe('function');
      expect(typeof service.getCapabilities).toBe('function');
      expect(typeof service.getOwnership).toBe('function');
      expect(typeof service.transferOwnership).toBe('function');
    });

    it('should return the same instance on subsequent calls', () => {
      const first = adapter.getAccessControlService();
      const second = adapter.getAccessControlService();

      expect(first).toBe(second);
    });

    it('should not create the service during adapter construction', () => {
      // Access the internal field via type assertion to verify it's null before first call
      const internalAdapter = adapter as unknown as { accessControlService: unknown };
      expect(internalAdapter.accessControlService).toBeNull();

      // After getAccessControlService(), it should be initialized
      adapter.getAccessControlService();
      expect(internalAdapter.accessControlService).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Service Interface Completeness
  // -------------------------------------------------------------------------

  describe('service interface', () => {
    it('should expose all AccessControlService methods', () => {
      const service = getEvmService();
      const expectedMethods = [
        'registerContract',
        'addKnownRoleIds',
        'getCapabilities',
        'getOwnership',
        'getAdminInfo',
        'getCurrentRoles',
        'getCurrentRolesEnriched',
        'transferOwnership',
        'acceptOwnership',
        'renounceOwnership',
        'transferAdminRole',
        'acceptAdminTransfer',
        'cancelAdminTransfer',
        'changeAdminDelay',
        'rollbackAdminDelay',
        'grantRole',
        'revokeRole',
        'renounceRole',
        'getHistory',
        'exportSnapshot',
        'discoverKnownRoleIds',
        'dispose',
      ];

      for (const method of expectedMethods) {
        expect(
          typeof (service as unknown as Record<string, unknown>)[method],
          `Expected method '${method}' to be a function`
        ).toBe('function');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Full Flow: Register → Detect → Read
  // -------------------------------------------------------------------------

  describe('full flow: register → capabilities → ownership', () => {
    it('should register a contract and detect Ownable2Step capabilities', async () => {
      const service = getEvmService();
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);

      // Register
      await service.registerContract(CONTRACT_ADDRESS, schema);

      // Detect capabilities
      const capabilities = await service.getCapabilities(CONTRACT_ADDRESS);

      expect(capabilities).toBeDefined();
      expect(capabilities.hasOwnable).toBe(true);
      expect(capabilities.hasTwoStepOwnable).toBe(true);
      expect(capabilities.hasAccessControl).toBe(false);
      expect(capabilities.hasEnumerableRoles).toBe(false);
      expect(capabilities.hasTwoStepAdmin).toBe(false);
    });

    it('should query ownership state with mocked RPC', async () => {
      const service = getEvmService();
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);

      // Register
      await service.registerContract(CONTRACT_ADDRESS, schema);

      // Mock RPC: owner() returns OWNER_ADDRESS, pendingOwner() returns zero address
      mockReadContract
        .mockResolvedValueOnce(OWNER_ADDRESS) // owner()
        .mockResolvedValueOnce(ZERO_ADDRESS); // pendingOwner()

      // Mock indexer health check as unavailable
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      const ownership = await service.getOwnership(CONTRACT_ADDRESS);

      expect(ownership).toBeDefined();
      expect(ownership.owner).toBe(OWNER_ADDRESS);
      expect(ownership.state).toBe('owned');
    });

    it('should detect renounced ownership (zero address)', async () => {
      const service = getEvmService();
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);

      await service.registerContract(CONTRACT_ADDRESS, schema);

      // Mock RPC: owner() returns zero address
      mockReadContract
        .mockResolvedValueOnce(ZERO_ADDRESS) // owner()
        .mockResolvedValueOnce(ZERO_ADDRESS); // pendingOwner()

      // Mock indexer as unavailable
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      const ownership = await service.getOwnership(CONTRACT_ADDRESS);

      expect(ownership.state).toBe('renounced');
    });
  });

  // -------------------------------------------------------------------------
  // Execute Transaction Callback Wiring
  // -------------------------------------------------------------------------

  describe('executeTransaction callback', () => {
    it('should wire signAndBroadcast as the transaction executor', async () => {
      const service = getEvmService();
      const schema = createSchema(OWNABLE_TWO_STEP_FUNCTIONS);

      await service.registerContract(CONTRACT_ADDRESS, schema);

      // Spy on signAndBroadcast to verify it's called through the callback
      const signAndBroadcastSpy = vi
        .spyOn(adapter, 'signAndBroadcast')
        .mockResolvedValue({ txHash: '0xmocktxhash123' });

      const mockExecutionConfig: ExecutionConfig = {
        method: 'eoa',
        allowAny: true,
      };

      const result = await service.transferOwnership(
        CONTRACT_ADDRESS,
        NEW_OWNER_ADDRESS,
        undefined,
        mockExecutionConfig
      );

      // Verify signAndBroadcast was called with the assembled transaction data
      expect(signAndBroadcastSpy).toHaveBeenCalledTimes(1);
      const callArgs = signAndBroadcastSpy.mock.calls[0];
      // First arg: txData (WriteContractParameters)
      expect(callArgs[0]).toHaveProperty('functionName', 'transferOwnership');
      expect(callArgs[0]).toHaveProperty('address', CONTRACT_ADDRESS);
      // Second arg: executionConfig
      expect(callArgs[1]).toEqual(mockExecutionConfig);

      // Verify result maps txHash to OperationResult.id
      expect(result).toEqual({ id: '0xmocktxhash123' });
    });
  });

  // -------------------------------------------------------------------------
  // AccessControlService type compatibility
  // -------------------------------------------------------------------------

  describe('type compatibility', () => {
    it('should be assignable to AccessControlService interface', () => {
      // getAccessControlService returns AccessControlService — TypeScript verifies the type
      const service: AccessControlService = adapter.getAccessControlService()!;
      expect(service).toBeDefined();
    });
  });
});
