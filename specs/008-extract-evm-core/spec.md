# Feature Specification: Extract EVM Core Package

**Feature Branch**: `008-extract-evm-core`  
**Created**: 2026-01-09  
**Status**: Draft  
**Input**: User description: "Extract EVM core logic defined in the architecture diagram into a separate internal (unpublishable) package adapter-evm-core which can be consumed by other adapters following EVM in some capacity."

## Clarifications

### Session 2026-01-09

- Q: Should viem be a direct dependency, peer dependency, or abstracted away in adapter-evm-core? → A: Direct dependency - adapter-evm-core includes viem in its dependencies; bundled into consuming adapters.
- Q: How should testing be organized for the core package? → A: Migrate existing tests - move relevant unit tests from adapter-evm to adapter-evm-core alongside the extracted modules.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adapter Developer Creates EVM-Compatible Adapter (Priority: P1)

An adapter developer needs to create a new adapter for an EVM-compatible blockchain (e.g., a Polkadot parachain like Moonbeam, or a Layer 2 rollup). Instead of duplicating the EVM adapter's core logic, they can import shared modules from `adapter-evm-core` and focus only on the ecosystem-specific customizations (network configs, wallet integration, branding).

**Why this priority**: This is the primary use case that drives the entire feature. Without reusable core modules, developers must copy-paste significant amounts of code, leading to maintenance burden and inconsistencies.

**Independent Test**: Can be fully tested by creating a minimal "test adapter" that imports `adapter-evm-core` modules and verifies they work correctly with a mock network configuration.

**Acceptance Scenarios**:

1. **Given** a new adapter package exists, **When** the developer imports ABI loading utilities from `adapter-evm-core`, **Then** they can fetch and parse contract ABIs from Etherscan-compatible explorers without writing custom code.

2. **Given** an adapter uses `adapter-evm-core` modules, **When** the developer builds the adapter, **Then** the core modules are bundled into the adapter's distributable and not exposed as separate external dependencies.

3. **Given** a new EVM-compatible adapter is created, **When** it imports type mapping, query handling, and transaction formatting from `adapter-evm-core`, **Then** all standard EVM operations work identically to the main EVM adapter.

---

### User Story 2 - EVM Adapter Continues Working Unchanged (Priority: P1)

The existing EVM adapter must continue to function exactly as before. The refactoring should be transparent to the EVM adapter's consumers—no breaking changes to its public API.

**Why this priority**: The EVM adapter is the most mature and heavily used adapter. Any regression would impact all existing users and deployments.

**Independent Test**: Run the full EVM adapter test suite after the extraction; all tests must pass without modification.

**Acceptance Scenarios**:

1. **Given** the extraction is complete, **When** the EVM adapter test suite runs, **Then** all existing tests pass without any changes to test code.

2. **Given** a builder application uses the EVM adapter, **When** the adapter is updated to use `adapter-evm-core` internally, **Then** the application behavior remains identical with no API changes.

---

### User Story 3 - Internal Package Not Published to npm (Priority: P2)

The `adapter-evm-core` package is an internal implementation detail. It should not be published to npm as a standalone package; instead, it should be bundled into consuming adapters at build time.

**Why this priority**: Publishing internal packages creates versioning complexity and maintenance burden. Bundling ensures consuming adapters are self-contained.

**Independent Test**: Verify that the package.json has `"private": true` and the package is not included in the workspace publish configuration.

**Acceptance Scenarios**:

1. **Given** the `adapter-evm-core` package exists, **When** a developer runs the workspace publish command, **Then** the core package is excluded from publishing.

2. **Given** an adapter imports from `adapter-evm-core`, **When** the adapter is built with tsup, **Then** the core modules are inlined into the adapter's dist files (not left as external imports).

---

### Edge Cases

- What happens when a consuming adapter needs to override a specific core module behavior? (Answer: They should be able to use composition/wrapping rather than modification)
- How does the system handle version mismatches if multiple adapters use different core versions? (Answer: Not applicable since core is bundled, not a shared runtime dependency)
- What happens if a core module requires adapter-specific configuration? (Answer: Core modules should accept configuration as parameters, not rely on global state)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST create a new internal package `packages/adapter-evm-core` that is not publishable to npm
- **FR-002**: The core package MUST export reusable modules for: ABI loading/transformation, type mapping, input parsing, output formatting, view function querying, transaction formatting, and address validation
- **FR-003**: The EVM adapter MUST be refactored to import and use modules from `adapter-evm-core` instead of its internal implementations
- **FR-004**: Core modules MUST accept network configuration and dependencies as parameters (dependency injection pattern)
- **FR-005**: The core package MUST NOT contain any ecosystem-specific branding, wallet UI components, or network definitions
- **FR-006**: Core modules MUST be pure functions or classes that don't rely on global state or singletons
- **FR-007**: The build system MUST bundle `adapter-evm-core` modules into consuming adapters (not as external dependencies)
- **FR-008**: The existing EVM adapter public API MUST remain unchanged after the extraction
- **FR-009**: The core package MUST include `viem` as a direct dependency (bundled into consuming adapters at build time)
- **FR-010**: Unit tests for extracted modules MUST be migrated from adapter-evm to adapter-evm-core alongside the code
- **FR-011**: Core modules MUST use `logger` from `@openzeppelin/ui-utils` for any logging (no `console` usage per Constitution II)
- **FR-012**: Core modules MUST propagate errors with descriptive messages; callers handle user-facing error presentation
- **FR-013**: The core package MUST use TypeScript strict mode (`"strict": true` in tsconfig.json)
- **FR-014**: The core package MUST export a `getEvmCoreViteConfig()` function via `vite-config.ts` (per Architecture §11), returning minimal config (empty arrays) since core has no WASM/special requirements

### Key Entities

- **`adapter-evm-core`**: Internal package containing shared EVM-compatible logic (ABI handling, type mapping, queries, transactions)
- **Core Modules**: Reusable functions/classes extracted from the EVM adapter (e.g., `loadAbiFromEtherscan`, `transformAbiToSchema`, `parseEvmInput`, `queryEvmViewFunction`)
- **Consuming Adapter**: Any adapter package that imports and uses `adapter-evm-core` modules (e.g., `adapter-evm`, a future `adapter-polkadot-evm`)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing EVM adapter tests pass after extraction (tests migrated to adapter-evm-core + remaining tests in adapter-evm must equal or exceed original 168+ tests)
- **SC-002**: Creating a new EVM-compatible adapter requires less than 50% of the code compared to duplicating the EVM adapter (baseline: ~2,500 LOC in adapter-evm src/ excluding tests; new adapter should require <1,250 LOC)
- **SC-003**: The `adapter-evm-core` package build produces no external dependencies on adapter-specific packages
- **SC-004**: The EVM adapter's bundle size increases by less than 5% after the refactoring (accounting for any import overhead)
- **SC-005**: A developer can import and use any core module with only `NetworkConfig` and explicit dependencies as parameters (no hidden global state)

## Assumptions

- The extraction follows the existing adapter architecture patterns documented in `docs/ADAPTER_ARCHITECTURE.md`
- Core modules will use the shared `@openzeppelin/ui-types` for type definitions
- The existing monorepo tooling (pnpm, tsup, TypeScript) supports internal non-published packages
- Wallet connection and UI components remain in the main EVM adapter (not extracted to core)
