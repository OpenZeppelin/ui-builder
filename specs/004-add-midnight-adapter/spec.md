# Feature Specification: Add Midnight Adapter

**Branches (stacked)**:

- `midnight/01-wallet`
- `midnight/02-ingestion`
- `midnight/03-auto-views`
- `midnight/04-write-export`
- `midnight/05-status`
- `midnight/06-rpc`
- `midnight/90-polish`  
  **Created**: 2025-10-11  
  **Status**: Draft  
  **Input**: User description: "Add Midnight Adapter. Analyze other adapters evm & stellar. Analyze the the @src/ midnight deploy cli in this workspace thoroughly as a lot from this cli will be used in the midnigh adapter for the ui builder. focus on logical phases that can be tested manually as soon as possible. IMPORTANT do not assume the features from the deploy cli, analyze the actual UI Builder monorepo, and the existing adapters to understand the features they provide."

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Connect Midnight wallet and show account (Priority: P1)

Users can connect a supported Midnight wallet in the Builder and see their account details and connection status. Wallet integration is implemented; this story focuses on verifying behavior and adding missing unit tests.

**Why this priority**: Enables all downstream actions; provides immediate value and a testable MVP.

**Independent Test**: From the Builder, select a Midnight network, open the wallet UI, click Connect, and verify the connected address is displayed and status reflects connected/disconnected.

**Acceptance Scenarios**:

1. **Given** the user has a Midnight wallet installed and unlocked, **When** they click Connect, **Then** the Builder shows the connected account address and connection status as Connected.
2. **Given** the user cancels or closes the wallet prompt, **When** they return to the Builder, **Then** the UI returns to Idle and no account is shown.
3. **Given** the wallet is locked, **When** the user attempts to connect, **Then** the UI indicates the wallet requires attention and returns to Idle if not completed within a reasonable timeout.

---

### User Story 2 - Load a Midnight contract into the Builder (Priority: P2)

Users can provide the required Midnight contract definition inputs and load a contract so that functions become available in the UI.

**Why this priority**: Enables building forms and interacting with contracts; mirrors how EVM/Stellar adapters expose contract loading.

**Independent Test**: Provide contract definition inputs (e.g., address, required identifiers, and contract interface) in the Define step and load the contract; verify function list appears with labels and basic field defaults.

**Acceptance Scenarios**:

1. **Given** valid contract definition inputs, **When** the user submits the form, **Then** the Builder displays the contract name (or identifier) and a list of callable functions.
2. **Given** missing or invalid inputs, **When** the user submits the form, **Then** the Builder shows clear validation errors and does not proceed.

---

### User Story 3 - Automatic simple view rendering (Priority: P3)

Once a contract is loaded, the Builder automatically surfaces simple view functions (no parameters) via `ContractStateWidget` and displays their results without manual invocation.

**Why this priority**: Matches existing Builder behavior; provides value without custom inputs; aligns with EVM/Stellar patterns for simple views.

**Independent Test**: Load a contract that exposes at least one parameter‑less view function and verify that `ContractStateWidget` renders and shows results or a clear empty state.

**Acceptance Scenarios**:

1. **Given** a loaded contract exposing parameter‑less view functions, **When** the widget initializes, **Then** it displays returned results or indicates that no simple view functions are available.
2. **Given** a runtime error while resolving view data, **When** the widget renders, **Then** it shows a helpful error state without crashing.

---

### User Story 4 - Customize write function form, execute, and export (Priority: P4)

Users select a write function, customize the generated form, execute the transaction from the Builder, or continue to export a working React app with Midnight support.

**Why this priority**: Reflects the Builder’s core flow; ensures export parity with EVM/Stellar adapters.

**Independent Test**: Choose a write function, customize form fields, run the transaction through the wallet flow, then export and run the generated React app to verify the same flow works.

**Acceptance Scenarios**:

1. **Given** a write function, **When** the user customizes the form and executes with valid inputs, **Then** the transaction is signed via wallet and status/identifier with indexing summary is shown.
2. **Given** the export step, **When** the user generates a React app, **Then** the app includes all required Midnight adapter dependencies and can run the same form and transaction successfully.

---

### User Story 5 - Sign and broadcast a transaction (Priority: P5)

Users can sign and submit a prepared transaction using their connected Midnight wallet and see a submission status and identifier.

**Why this priority**: Unlocks end‑to‑end interaction; milestone beyond read‑only.

**Independent Test**: From a prepared transaction, click Submit, approve in wallet, and verify the Builder shows a submitted identifier and status feedback.

**Acceptance Scenarios**:

1. **Given** a prepared transaction and connected wallet, **When** the user confirms in the wallet, **Then** the Builder shows a submitted identifier and a success status, alongside an indexing check summary.
2. **Given** the user rejects in the wallet, **When** control returns to the Builder, **Then** the UI shows a clear rejection message and returns to a safe state.

---

### User Story 6 - Test RPC connectivity (Priority: P6)

Users can run a network connectivity check for the selected Midnight network and see latency/success feedback.

**Why this priority**: Early troubleshooting; mirrors EVM/Stellar diagnostics.

**Independent Test**: From network settings, run Test Connection and verify a success/failure message with basic timing.

**Acceptance Scenarios**:

1. **Given** a reachable endpoint, **When** the user runs the test, **Then** the Builder shows success with a response time.
2. **Given** an unreachable endpoint, **When** the user runs the test, **Then** the Builder shows failure with a user‑friendly explanation.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Wallet is installed but locked; user cancels or ignores prompts.
- Wallet not installed; user attempts to connect.
- Connection drops or account changes mid‑session.
- Contract definition inputs are malformed or incomplete.
- A function marked view is actually unavailable at runtime.
- Long‑running operations (e.g., proofing) exceed user attention thresholds.
- No public explorer available; transaction status still needs to be communicated.
- Indexing delays cause data to be temporarily unavailable after submission.
- Exported app missing dependencies or adapter configuration for Midnight.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001 (Wallet Connection)**: Users MUST be able to connect and disconnect a Midnight wallet from within the Builder, with clear Connected/Disconnected states.
- **FR-002 (Account Display)**: When connected, the Builder MUST display an account identifier and reflect live connection status.
- **FR-003 (Contract Loading)**: Users MUST be able to provide contract definition inputs required by the Midnight ecosystem and load a contract, resulting in a visible function list.
- **FR-004 (Validation)**: The Builder MUST validate contract inputs and display actionable error messages on failure.
- **FR-005 (View Calls)**: Users MUST be able to execute read‑only functions and see decoded results or clear errors (v1: parameter‑less auto‑views; no parameter input UI).
- **FR-006 (Prepare Transaction)**: Users MUST be able to populate a write function for execution. (No separate preview UI in v1; follow existing Builder behavior.)
- **FR-007 (Sign & Broadcast)**: Users MUST be able to sign and submit a transaction using their connected wallet and see a submission identifier and status feedback.
- **FR-008 (Connectivity Test)**: Users MUST be able to test network connectivity and see success/failure and latency.
- **FR-009 (Status & Errors)**: All operations MUST provide progress feedback and human‑readable errors without exposing internal details.
- **FR-010 (Parity with Adapters)**: Behaviors MUST be consistent with established patterns in EVM and Stellar adapters where applicable (e.g., network‑aware, phased execution, diagnostics).

**FR-011 (Execution Methods v1)**: Initial release MUST support direct wallet signing only; relayer or other methods are out of scope for v1.
**FR-012 (Required Contract Inputs)**: The contract definition inputs MUST match `getContractDefinitionInputs()` in the adapter: `contractAddress` (required), `privateStateId` (required), `contractSchema` (.d.ts, required), `contractModule` (.cjs, required), and optional `witnessCode`.
**FR-013 (Post‑Submission Status)**: After successful submission, the UI MUST display a transaction identifier and an indexing check summary that indicates whether indexing has been observed or may require additional time.
**FR-014 (Automatic View Rendering)**: The system MUST automatically render parameter‑less view functions via `ContractStateWidget` with graceful error handling.
**FR-015 (Export Parity)**: The export feature MUST include Midnight adapter dependencies and configuration so the generated React app runs wallet connection, contract loading, simple views, and write‑function execution consistent with in‑Builder behavior.
**FR-016 (Contract Ingestion Persistence)**: The system MUST persist necessary contract definition inputs for later steps and reliably load the contract schema; failure cases must show actionable errors.
**FR-017 (Dependency Sync Policy)**: Adapter dependency declarations in `packages/adapter-midnight/src/config.ts` MUST match the export manifest for v1 scope. Placeholder dependencies may be retained but MUST be clearly marked as non‑active for v1 and excluded from export manifests.
**FR-018 (Mapping Parity)**: Field type mapping, default field generation, and compatibility rules MUST mirror established patterns in EVM/Stellar adapters where applicable to ensure consistent form behavior across ecosystems.

### Key Entities _(include if feature involves data)_

- **WalletConnection**: Connection status and account identifier used by the Builder.
- **Network**: Selected Midnight network configuration (id, name, connectivity status).
- **ContractArtifacts**: User‑provided contract definition inputs required to load a Midnight contract.
- **ContractSchema**: Chain‑agnostic representation of contract functions and events used by the Builder.
- **FunctionDefinition**: A callable function’s metadata, including whether it modifies state.
- **TransactionPayload**: Prepared data derived from user inputs for a write function.
- **ExecutionConfig**: For v1, defaults to direct wallet signing only.
- **TxStatus**: Submission identifier and progress states shown to the user.
- **ExportManifest**: The list of packages, configuration, and files required for a Midnight‑ready exported app.

## Dependencies & Assumptions (optional)

- The Builder already supports registering a Midnight ecosystem and instantiating the adapter per network.
- Wallet capabilities for Midnight expose a connect flow and provide an account identifier to display.
- Indexing and node connectivity may introduce user‑visible delays; the UI provides progress feedback.
- Core packages remain chain‑agnostic; all chain‑specific logic and dependencies live only in adapter packages per Constitution Check.

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Users can connect or cancel the wallet flow and return to a stable UI state in under 30 seconds.
- **SC-002**: Contract loading with valid inputs completes with a visible function list in under 10 seconds, 90% of the time.
- **SC-003**: 95% of view calls with valid inputs return a readable result or a clear error message within 5 seconds.
- **SC-004**: 90% of transaction submissions with user approval return a submission identifier and success message without requiring a page reload.
- **SC-005**: Network test feedback appears in under 5 seconds for reachable endpoints and shows a clear failure message for unreachable ones.
