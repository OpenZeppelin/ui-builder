<!--
Sync Impact Report
Version: 1.2.1 → 1.2.2
Modified Principles: none
Added sections: none
Removed sections: none
Templates:
- ✅ .specify/templates/plan-template.md
Follow-up TODOs: none
-->

# UI Builder Constitution

## Core Principles

### I. Chain-Agnostic Core, Adapter-Led Architecture (NON-NEGOTIABLE)

- The builder app (`packages/builder`), renderer (`packages/renderer`), UI components
  (`packages/ui`), utils (`packages/utils`), react-core (`packages/react-core`),
  storage (`packages/storage`), styles (`packages/styles`), and shared types
  (`packages/types`) MUST remain chain-agnostic.
- All chain-specific logic, dependencies, and polyfills live exclusively in adapter
  packages (`packages/adapter-*`).
- Adapters MUST implement `ContractAdapter` from
  `packages/types/src/adapters/base.ts` and be instantiated with a `NetworkConfig`.
- The builder MUST resolve adapters through dynamic ecosystem registration via the
  ecosystem manager (`packages/builder/src/core/...`).
- Chain-agnostic packages MUST NOT declare chain-specific dependencies.
- Validation rules originate in the adapter interface; `isValidAddress(address:
string, addressType?: string)` supports chain-specific behavior.
- The EVM adapter is the reference implementation; all new adapters MUST mirror
  its structure, naming, and patterns. Stellar mirrors EVM wherever applicable.
- Rationale: Preserves ecosystem neutrality and predictable adapter boundaries to
  sustain long-term maintainability.

### II. Type Safety, Linting, and Code Quality (NON-NEGOTIABLE)

- TypeScript strictness, shared linting, and formatting rules apply across the
  monorepo.
- `console` usage in source code is prohibited; use `logger` from
  `@openzeppelin/ui-builder-utils` instead (exceptions only in tests, stories, or
  scripts).
- Logging is disabled by default outside development; enable explicitly via
  `logger.configure({ enabled: true, level })`.
- `any` types are disallowed without explicit justification; prefer precise
  generics.
- Public library APIs MUST include JSDoc annotations as configured.
- Rationale: Enforces consistent quality gates that prevent regressions and
  ensures actionable diagnostics across packages.

### III. Tooling, Packaging, and Releases (NON-NEGOTIABLE)

- `pnpm` is the sole package manager; use `pnpm -r` for workspace commands.
- Build outputs use `tsup` for bundling and `tsc --emitDeclarationOnly` for types,
  shipping both ESM and CJS where applicable.
- Versioning relies on Changesets; CI publishes releases on merge to `main` after
  tests, linting, and type checks pass.
- Shared configs (`tailwind.config.cjs`, `postcss.config.cjs`, `components.json`)
  are consumed via lightweight proxies.
- Rationale: Maintains reproducible builds, consistent release automation, and
  eliminates tooling drift.

### IV. UI/Design System Consistency (NON-NEGOTIABLE)

- A single design system governs the builder, renderer, and exported apps.
- Styling leverages Tailwind CSS v4 with shadcn/ui primitives via
  `@openzeppelin/ui-builder-styles` and root configs.
- Use the `cn` utility from `@openzeppelin/ui-builder-utils` for class
  composition.
- Prefer `lucide-react` icons; avoid emojis or inline raw SVG when reusable
  assets exist.
- Apply standard Tailwind sizing tokens; use arbitrary values only with
  documented justification.
- Follow form layout patterns such as `flex flex-col gap-2` or `space-y-*` for
  spacing consistency.
- Rationale: Guarantees cohesive UI/UX and reduces maintenance overhead across
  shared surfaces.

### V. Testing, Documentation, and Exported Apps (NON-NEGOTIABLE)

- Vitest is the standard for unit and integration tests; Storybook documents
  components and supports visual verification.
- Coverage metrics are tracked in CI; adapter docs and architectural references
  MUST remain current when interfaces change.
- Exported apps MUST build as standalone React + Vite bundles with runtime
  configuration supplied via `AppConfigService` (`public/app.config.json` for
  exports).
- Local exports reference `workspace:*`; production exports consume published
  `latest` versions.
- Feature flags gate functionality according to ecosystem readiness.
- Rationale: Ensures reliable distribution channels and prevents regressions in
  consumer-facing exports.

### VI. Test-Driven Development for Business Logic (NON-NEGOTIABLE)

- All business logic (services, adapters, validators, storage, networking,
  transforms) MUST follow TDD: write failing tests first, implement minimal
  code, then refactor.
- UI components in `.tsx` files are exempt but should leverage Storybook or
  interaction tests where feasible.
- Vitest remains the standard runner; use mocking only when essential to keep
  tests fast and focused.
- Rationale: Preserves confidence in critical logic and enforces disciplined
  implementation sequencing.

### VII. Reuse-First Development (NON-NEGOTIABLE)

- Existing utilities, types, services, and patterns MUST be preferred over new
  implementations unless reuse compromises integrity.
- Conduct thorough codebase analysis before planning or implementation to
  identify reusable modules (e.g., adapters, `AppConfigService`, transformers).
- Introduce new modules only when reuse is impossible; document rationale and
  alternatives.
- Extending `packages/types/src/adapters/base.ts` requires updating associated
  lint rules (e.g., `no-extra-adapter-methods`).
- Shared logic across adapters belongs in `packages/utils` or `packages/types`;
  avoid duplication of chain-agnostic behavior.
- Document reuse decisions in specs and plans; reviewers enforce compliance with
  this principle.
- Rationale: Minimizes redundancy, keeps abstractions aligned, and streamlines
  onboarding.

## Additional Constraints

- Do not add chain-specific code or polyfills to chain-agnostic packages;
  adapters own network concerns.
- Data schemas and shared types have a single source of truth in
  `packages/types`.
- Prefer shared utilities from `@openzeppelin/ui-builder-utils` (e.g., `logger`,
  `AppConfigService`, `cn`, ID generation); use lodash `debounce` when
  debouncing is required.
- Avoid noisy logging; rely on structured, level-based logs only when
  investigating issues.
- Contract comparisons MUST operate on raw contract definitions (ABI/IDL/etc.),
  not on internal `ContractSchema` representations.
- Security: do not hardcode secrets; use runtime configuration.

## Development Workflow and Review Process

- Use `pnpm` for all tasks (`pnpm dev`, `pnpm build`, `pnpm test`,
  `pnpm -r format:check`, `pnpm fix-all`).
- Commit messages follow Conventional Commits and pass commitlint; Commitizen
  (`pnpm commit`) is available.
- Before opening a PR, ensure tests, type checks, and linting pass
  workspace-wide; include a Changeset for public package changes.
- Adapter contributions MUST follow the Adapter Architecture Guide:
  network-aware constructor, exports, ecosystem registration, strict interface
  compliance.
- Code review enforces constitutional adherence, architecture boundaries, and
  design system consistency.
- Reuse-First Gate: reviewers verify reuse attempts before approving new
  modules.

## Governance

- This constitution supersedes other practices for architecture, quality, and
  workflow standards; non-negotiable rules MUST be enforced during development
  and review.
- Amendments require a documented proposal, updates to relevant guides/READMEs,
  migration notes if applicable, and approval via PR review.
- Breaking changes demand a Changeset with a major version bump and explicit
  upgrade notes; commit messages must flag breaking changes per convention.
- CI enforces compliance; PRs violating constitutional rules MUST be corrected
  before merge.

**Version**: 1.2.2 | **Ratified**: 2025-09-17 | **Last Amended**: 2025-10-09
