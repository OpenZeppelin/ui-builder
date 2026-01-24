# Migration Requirements Quality Checklist: Wagmi v3 Upgrade

**Purpose**: Validate specification completeness and quality before implementation (Author self-review)  
**Created**: 2026-01-08  
**Updated**: 2026-01-08 (gaps resolved)  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)  
**Focus**: Comprehensive - Migration Completeness, Compatibility, Breaking Changes, Pre-implementation

---

## 🚨 Critical Blocking Gate

- [x] **CHK001** - Is RainbowKit v3/Wagmi v3 compatibility verification explicitly defined as the FIRST blocking task? [Completeness, Spec §FR-011] ✅ *Added verification steps and go/no-go criteria*
- [x] **CHK002** - Are the go/no-go criteria for RainbowKit compatibility clearly specified? [Clarity, Spec §FR-011] ✅ *GO: modal opens, wallet displays, connection succeeds. NO-GO: console errors, modal fails*
- [x] **CHK003** - Is the fallback strategy (wait for RainbowKit v3) documented with clear trigger conditions? [Completeness, Spec §Clarifications] ✅ *If NO-GO, wait for RainbowKit v3, monitor PR #2591*
- [x] **CHK004** - Are requirements for how to verify RainbowKit compatibility specified (e.g., which tests, which behaviors)? [Completeness, Spec §FR-011] ✅ *3-step verification process added*

---

## Migration Completeness

### Package Version Requirements

- [x] **CHK005** - Are ALL package.json files requiring updates explicitly listed? [Completeness, Spec §Impact Analysis] ✅ *adapter-evm, apps/builder, root package.json*
- [x] **CHK006** - Are the exact target versions specified for each dependency (wagmi, @wagmi/core, @wagmi/connectors)? [Clarity, Spec §FR-001 to §FR-003] ✅ *^3.0.0 for wagmi and @wagmi/core*
- [x] **CHK007** - Is the pnpm override update requirement clearly specified with old and new values? [Clarity, Spec §FR-004] ✅ *Old: ^2.20.3, New: ^3.0.0*
- [x] **CHK008** - Are version ranges (^3.0.0 vs exact) explicitly defined with rationale? [Clarity, Spec §FR-009] ✅ *Exact versions for connector deps, caret for wagmi*

### Hook Migration Requirements

- [x] **CHK009** - Is the complete list of hook renames documented? [Completeness, Spec §Background] ✅ *useAccount→useConnection, useSwitchAccount→useSwitchConnection, useAccountEffect→useConnectionEffect*
- [x] **CHK010** - Are ALL files containing hook usages explicitly enumerated? [Completeness, Spec §Impact Analysis] ✅ *6 files listed*
- [x] **CHK011** - Are type migration requirements (UseAccountReturnType → UseConnectionReturnType) complete? [Completeness, Spec §FR-006] ✅
- [x] **CHK012** - Is it specified how to discover any ADDITIONAL hook usages not in the enumerated list? [Completeness, Spec §FR-017] ✅ *Discovery command added: rg "useAccount|useSwitchAccount|useAccountEffect"*
- [x] **CHK013** - Are requirements for `useSwitchAccount` → `useSwitchConnection` conditional ("if present") - is presence verified? [Clarity, Spec §FR-008] ✅ *Verification command added*

### Connector Dependencies Requirements

- [x] **CHK014** - Are ALL required connector peer dependencies listed with exact versions? [Completeness, Spec §FR-009] ✅ *@coinbase/wallet-sdk@^4.3.6, @walletconnect/ethereum-provider@^2.21.1*
- [x] **CHK015** - Is the rationale for each connector dependency documented (which connector uses which dep)? [Clarity, Spec §FR-009] ✅ *Rationale added*
- [x] **CHK016** - Are requirements for OPTIONAL vs REQUIRED connectors distinguished? [Clarity, Spec §FR-009] ✅ *REQUIRED vs OPTIONAL clearly marked*
- [x] **CHK017** - Is the MetaMask SDK requirement conditional ("if used") - is this verified? [Clarity, Spec §FR-009] ✅ *Marked as OPTIONAL, RainbowKit uses injected connector*

---

## Compatibility Requirements

### RainbowKit Compatibility

- [x] **CHK018** - Are specific RainbowKit behaviors to verify defined? [Completeness, Spec §FR-011] ✅ *Modal opens, wallet list displays, connection succeeds, disconnect works*
- [x] **CHK019** - Are RainbowKit configuration changes (if any) documented? [Completeness, Spec §FR-011] ✅ *Check for v3.x or test v2.x compatibility*
- [x] **CHK020** - Is the minimum compatible RainbowKit version specified? [Completeness, Spec §FR-011] ✅ *^3.0.0 if available, or verified v2.x*

### Backward Compatibility

- [x] **CHK021** - Is "public API" explicitly defined - what IS and IS NOT included? [Clarity, Spec §FR-012] ✅ *Public: ContractAdapter methods, types, configs. NOT public: facade hooks, internal utils*
- [x] **CHK022** - Is the facade hooks decision (internal, not public) documented with rationale? [Completeness, Spec §Clarifications] ✅
- [x] **CHK023** - Are requirements for exported apps' compatibility specified? [Completeness, Spec §SC-003] ✅ *Verification via pnpm test:export*
- [x] **CHK024** - Are requirements for consuming applications' upgrade path documented? [Completeness, Spec §FR-015] ✅ *Detailed changeset example with migration steps*

### Dependency Compatibility

- [x] **CHK025** - Is viem compatibility explicitly verified (not just assumed)? [Verified, Spec §Assumptions] ✅ *Source reference added: wagmi v3 requires viem 2.x*
- [x] **CHK026** - Is @tanstack/react-query compatibility specified? [Completeness, Spec §Assumptions] ✅ *^5.0.0 required, current compatible*
- [x] **CHK027** - Is TypeScript version compatibility documented with specific minimum? [Completeness, Spec §Background] ✅ *5.7.3 minimum, current 5.9.2*
- [x] **CHK028** - Are React version compatibility requirements specified? [Completeness, Spec §Assumptions] ✅ *React 18+ required, current React 19*

---

## Breaking Changes Documentation

### Consumer Impact

- [x] **CHK029** - Are breaking changes for adapter-evm consumers explicitly listed? [Completeness, Spec §FR-015] ✅ *MAJOR change: wagmi peer dep ^2→^3*
- [x] **CHK030** - Is the peer dependency change (wagmi ^2 → ^3) documented as breaking? [Completeness, Spec §FR-015] ✅ *Changeset type: MAJOR*
- [x] **CHK031** - Are migration steps for consumers documented in changeset requirements? [Completeness, Spec §FR-015] ✅ *3-step migration in example changeset*
- [x] **CHK032** - Is the connector dependency installation requirement for consumers documented? [Completeness, Spec §FR-015] ✅ *Step 2 in migration: install connector deps*

### Internal Impact

- [x] **CHK033** - Are ALL affected packages clearly enumerated? [Completeness, Spec §Impact Analysis] ✅ *adapter-evm, apps/builder*
- [x] **CHK034** - Are packages explicitly NOT affected listed to avoid confusion? [Completeness, Spec §Impact Analysis] ✅ *adapter-evm-core, adapter-stellar, adapter-solana, adapter-midnight*
- [x] **CHK035** - Is the scope boundary (adapter-evm, apps/builder only) clearly defined? [Clarity, Plan §Scale/Scope] ✅

---

## Requirements Clarity & Measurability

### Success Criteria Quality

- [x] **CHK036** - Is "100% test pass rate" measurable and achievable? [Measurability, Spec §SC-001] ✅ *Verification: pnpm test exits code 0*
- [x] **CHK037** - Is "works end-to-end" defined with specific test scenarios? [Clarity, Spec §SC-002] ✅ *5-step manual verification added*
- [x] **CHK038** - Is "no version conflicts" verifiable with specific pnpm command? [Clarity, Spec §SC-004] ✅ *pnpm install exits code 0, no peer warnings*
- [x] **CHK039** - Is "no wagmi-related type errors" scoped to specific compilation targets? [Clarity, Spec §SC-005] ✅ *pnpm typecheck exits code 0*

### Acceptance Scenarios Quality

- [x] **CHK040** - Are acceptance scenarios testable without implementation knowledge? [Measurability, Spec §US-1 to §US-4] ✅ *Gherkin format with observable outcomes*
- [ ] **CHK041** - Do acceptance scenarios cover both happy path and error conditions? [Coverage] ⚠️ *Deferred: Error scenarios not critical for upgrade validation*
- [x] **CHK042** - Are "works identically" criteria quantifiable? [Clarity, Spec §SC-002] ✅ *5-step verification defines "identically"*

---

## Edge Cases & Error Handling

- [x] **CHK043** - Are version conflict resolution requirements specified? [Completeness, Spec §Edge Cases] ✅ *pnpm strict resolution, consumer must upgrade or use overrides*
- [x] **CHK044** - Are rollback requirements defined if upgrade fails? [Completeness, Spec §Rollback Plan] ✅ *git checkout, pnpm install, pnpm test*
- [x] **CHK045** - Are partial upgrade state requirements defined (e.g., some packages upgraded, others not)? [Completeness, Spec §Edge Cases] ✅ *Rollback triggers defined*
- [x] **CHK046** - Are requirements for handling mixed v2/v3 in consumer dependency trees documented? [Completeness, Spec §Edge Cases] ✅ *Document in migration notes*

---

## Dependencies & Assumptions

- [x] **CHK047** - Is the dependency on `009-polkadot-adapter` clearly documented? [Completeness, Spec §Dependencies] ✅ *Prerequisite for 009-polkadot-adapter*
- [x] **CHK048** - Are ALL assumptions explicitly listed and validated? [Completeness, Spec §Assumptions] ✅ *6 assumptions with sources*
- [x] **CHK049** - Is the "VERIFY FIRST" assumption actionable with specific verification steps? [Clarity, Spec §FR-011] ✅ *3-step verification process*
- [x] **CHK050** - Is the viem compatibility assumption validated with source reference? [Verified, Spec §Assumptions] ✅ *GitHub source referenced*

---

## Traceability & Consistency

- [x] **CHK051** - Do functional requirements (FR-001 to FR-017) cover ALL user stories? [Traceability] ✅ *FR-001-017 now cover all US*
- [x] **CHK052** - Do success criteria (SC-001 to SC-007) map to functional requirements? [Traceability] ✅
- [x] **CHK053** - Are clarification decisions reflected in updated requirements? [Consistency, Spec §Clarifications] ✅ *FR-011, FR-012 updated*
- [x] **CHK054** - Is the spec status ("Ready for Planning") consistent with blocking conditions? [Consistency] ✅ *Planning complete, ready for tasks*

---

## Summary

**Total Items**: 54  
**Resolved**: 53 ✅  
**Deferred**: 1 ⚠️ (CHK041 - error scenarios not critical for upgrade)

### Gaps Addressed

| Gap | Resolution |
|-----|------------|
| RainbowKit verification steps | Added FR-011 with 3-step verification and go/no-go criteria |
| Consumer migration documentation | Added detailed changeset example in FR-015 |
| Rollback/partial failure requirements | Added Rollback Plan section |
| Assumption validation | Added source references for viem, TypeScript, React, react-query |
| Hook discovery process | Added FR-017 with discovery command |
| Connector required vs optional | Updated FR-009 with clear distinction |
| Measurable success criteria | Updated SC-001 through SC-007 with verification commands |

**Status**: ✅ Ready for `/speckit.tasks`
