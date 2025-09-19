# Feature Specification: Contract Definition Provider Integration (Contract Definition Fallback + Deep Links)

**Feature Branch**: `[001-sourcify-integration]`  
**Created**: 2025-09-16  
**Status**: Draft  
**Input**: User description: "Integrate Sourcify as a fallback source to fetch verified contract ABIs when Etherscan fails or is unavailable. Add URL query parameters so Sourcify can deep-link users into the Builder, e.g., `?address=0xdAC17F958D2ee523a2206206994597C13D831ec7&chainId=1`. Keep Etherscan as primary; Sourcify requires no API key and is open source."

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing (mandatory)

### Primary User Story

As a user of the Contracts UI Builder, I can select a network and provide a contract identifier. The system first attempts to load the verified contract definition from the adapter’s primary verification provider. If the primary provider is unavailable, rate limited, returns an error, or the contract is not verified there, the system automatically falls back to the next provider in that adapter’s precedence order (for example, the EVM adapter may use Etherscan first and Sourcify second). I can also arrive via a chain‑agnostic deep link that includes an explicit `ecosystem` parameter and adapter‑interpreted parameters (e.g., for EVM: `address` and `chainId`; other ecosystems may expose their own), which preselects the network, pre-fills the identifier, and triggers loading. Additionally, I can configure a default verification provider per network either via application configuration or via the existing network configuration interface, and I can force a specific provider for a single session via a `service` query parameter.

### Acceptance Scenarios

1. Given the contract is verified on the adapter’s primary verification provider, When the user provides a valid identifier and network, Then the contract definition loads successfully and the UI indicates that provider as the source.
2. Given the primary provider returns an error (e.g., rate limit, server error, invalid response), When the user provides a valid identifier and network, Then the system automatically falls back to the next provider and loads the contract definition if available, indicating that provider as the source.
3. Given a contract is not verified on the primary provider but is verified on a fallback provider, When the user provides the identifier and network, Then the contract definition loads from the fallback provider and the source is indicated accordingly.
4. Given no provider can supply a verified contract definition (e.g., unverified or not found), When the user provides the identifier and network, Then the system clearly explains that no verified contract definition was found and instructs the user to provide it manually (if adapter supports manual input).
5. Given a deep link `?ecosystem=evm&address=…&chainId=1`, When a user opens the Builder, Then the Builder auto-selects the EVM network corresponding to `chainId=1`, pre-fills the `address`, and attempts to load the contract definition using the provider precedence policy.
6. Given a deep link with an unknown or unsupported `chainId`, When a user opens the Builder, Then the Builder does not break, shows a friendly message indicating the chain is unsupported, and prompts the user to choose a supported network.
7. Given an invalid address format, When the user attempts to load, Then the Builder blocks the request and displays a clear validation message.
8. Given a successful contract definition load from any provider, When the contract uses a proxy/upgradability pattern (where applicable), Then existing behaviors (detection, messaging, selection) continue to work unchanged.
9. Given a deep link that includes adapter-provided parameters appropriate to a non-EVM ecosystem, When a user opens the Builder, Then the Builder preselects the corresponding network, pre-fills the contract identifier, and attempts to load its definition using that adapter’s primary-then-fallback verification sources.
10. Given an ecosystem with its own verification services (not Etherscan/Sourcify), When a user arrives via deep link, Then the same provenance, fallback, and messaging behaviors apply based on the adapter’s declared sources.
11. Given a default contract definition provider configured via application configuration or via the network configuration interface, When the user loads a contract, Then the configured provider is used as the primary according to the adapter’s precedence rules.
12. Given a deep link that includes a `service` parameter recognized by the active adapter, When a user opens the Builder, Then that provider is used (forced) for contract definition provenance, taking precedence over any configured default.

### Edge Cases

- Primary source returns HTTP 200 but a semantically invalid or empty payload; fallback still occurs.
- Conflicting ABIs across sources (e.g., different versions). The system prefers the primary source by default when both succeed, and communicates source provenance; users can still provide a custom ABI if needed.
- Slow or hanging responses from the primary provider; a hard timeout of 4,000 ms per provider triggers fallback automatically. A global budget of 10,000 ms applies to the overall load attempt.
- Networks without coverage by a given provider; the system does not present provider‑specific errors and retains current behaviors.
- Deep link parameters present while the user has a saved configuration in progress; deep link takes precedence. The system must not cause data loss and must clearly indicate what will be loaded.
- Adapter-specific deep link parameter collisions (e.g., both generic and adapter-specific params provided); the adapter defines precedence and the UI surfaces a clear resolution message.
- Contracts on networks without Sourcify coverage; the system does not present Sourcify-specific errors and retains current behaviors.
- `service` parameter specifies a provider unsupported for the selected ecosystem/network; the system informs the user and automatically falls back to the adapter’s default provider order.
- `service` parameter forces a provider that returns "not found" or is unavailable; the system honors the forced choice and stops with a clear message (no automatic fallback).

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: The system MUST support multiple contract definition providers per adapter with an explicit precedence order (e.g., EVM adapter example: Etherscan primary, Sourcify fallback). Adapters MUST declare this order without introducing new base interface methods.
- **FR-002**: The system MUST attempt the primary provider first and ONLY upon failure or unavailability attempt the next provider in the order.
- **FR-003**: Failure conditions that MUST trigger fallback include: network errors, HTTP non‑success, malformed/empty responses, explicit "not verified/not found" statuses, or missing/invalid credentials at the primary provider.
- **FR-004**: The system MUST support providers that do not require API keys; keys MUST NOT be required where not needed. For EVM, explorer configuration MUST reuse existing `resolveExplorerConfig()` and `UserExplorerConfigService`/`AppConfigService`.
- **FR-005**: The system MUST communicate contract definition provenance to the user (e.g., "Loaded from <provider>").
- **FR-006**: The system MUST maintain the current user flow for manual contract definition input when no provider supplies a verified definition (if adapter supports manual input).
- **FR-007**: The system MUST preserve existing behaviors (e.g., proxy/upgradability detection and flows where applicable) after a contract definition is loaded from any provider.
- **FR-008**: The system MUST add chain‑agnostic deep-linking via URL query parameters at the Builder root. Deep links MUST include an explicit `ecosystem` parameter (e.g., `evm`, `stellar`, `solana`, `midnight`). For EVM, default parameters include `address` and `chainId`; other ecosystems MAY expose adapter‑specific parameters via existing input names from `getContractDefinitionInputs()`.
- **FR-009**: When the required parameters are provided and valid, the system MUST auto-select the corresponding network, pre-fill the identifier, and attempt loading using the provider precedence policy.
- **FR-010**: If the provided network identifier is unknown/unsupported, the system MUST show a clear message and prompt the user to choose a supported network without breaking the page.
- **FR-011**: The system MUST validate the contract identifier format per the active adapter using existing methods (e.g., `isValidAddress`) before issuing network requests and show a helpful error if invalid.
- **FR-012**: The system MUST display clear, user-friendly error messages for each failure case (rate limit/unavailable, unverified/not found, invalid input, unsupported network).
- **FR-014**: The system SHOULD avoid long blocking waits; per-provider hard timeout is 4,000 ms, with fallback triggered thereafter and a total budget of 10,000 ms per load attempt.
- **FR-015**: The system SHOULD surface a link to view verification at the provider (when available) using existing UI patterns and placement.
- **FR-016**: Deep-linking MUST work seamlessly across all adapters (chain‑agnostic). The Builder MUST rely on each active adapter to interpret and validate its deep link parameters based on `getContractDefinitionInputs()`.
- **FR-017**: Each adapter MUST define a minimal deep-link parameter schema sufficient to identify the target network and contract identifier for its ecosystem, and MUST document which parameters it honors (without changing the base adapter interface).
- **FR-018**: Each adapter MAY declare ecosystem‑specific contract definition providers and a primary→fallback order (e.g., EVM: Etherscan → Sourcify; Stellar: SDK only).
- **FR-019**: When both generic and adapter‑specific parameters are present, the adapter’s precedence rules MUST apply, and the UI MUST not fail silently (provide clear guidance to the user if there is a conflict).
- **FR-020**: Deep links MUST be forward‑compatible: unknown parameters are ignored gracefully, and absence of adapter‑specific parameters MUST not break the app.
- **FR-021**: Users MUST be able to configure a default contract definition provider per network via application configuration.
- **FR-022**: Users MUST be able to configure a default contract definition provider per network via the existing network configuration interface in the UI.
- **FR-023**: Deep links MUST support a chain‑agnostic `service` parameter to force the contract definition provider for that session; accepted values are adapter‑defined.
- **FR-024**: Precedence MUST be deterministic: forced `service` in URL > user’s per‑network UI setting > application configuration default > adapter‑declared default order.
- **FR-025**: If the forced `service` is unsupported for the selected ecosystem/network, the system MUST inform the user and automatically fall back to the adapter’s default contract definition provider order.
- **FR-026**: If the forced `service` fails (e.g., not found/unavailable), the system MUST honor the forced choice and stop with a clear message (no automatic fallback).

### Adapter Notes (Reuse-First)

- EVM: Reuse `etherscan.ts`/`etherscan-v2.ts` for primary provider and `resolveExplorerConfig()` for API URL/key resolution; add only a thin Sourcify fallback module that mirrors the same transform flow to `ContractSchema`.
- Stellar: Reuse existing SDK-based contract loading in `loadStellarContractFromAddress` and explorer URL helpers for provenance only; no new providers are introduced now.

### Key Entities

- **Contract Definition Provider**: Represents the provenance of the loaded contract definition. Attributes: provider name (e.g., explorer/repository/manual), status (success/failure), human-readable message, optional link to provenance page.
- **Deep Link Parameters**: Chain‑agnostic parameters used to pre‑fill network and contract identifier and trigger fetch (e.g., `address` and `chainId` for EVM; adapter‑specific variants for other ecosystems). Includes optional `service` to force the contract definition provider for that session.
- **Error/Status Messages**: Human-readable messages that explain what happened (e.g., rate limited, not verified) and what the user can do next (e.g., try again, paste contract definition manually, change network).
- **Adapter Deep‑Link Schema**: Adapter‑provided description of the parameters it supports for deep linking (e.g., identifiers for network selection and contract/resource selection), used by the Builder to parse and validate incoming links.
- **Contract Definition Providers (Adapter-Declared)**: Adapter-provided list of contract definition providers and their precedence for the ecosystem, enabling consistent provenance and fallback behavior across adapters.
- **Contract Definition Provider Preference**: User/default preference for contract definition provider at multiple scopes (application configuration, per-network UI setting, forced via URL), with a defined precedence order.

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
