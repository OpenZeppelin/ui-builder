<!--
Sync Impact Report
Version: 1.2.2 → 1.3.0
Modified Principles: Updated for UI Kit extraction to openzeppelin-ui monorepo
- Section I: Core packages now external (@openzeppelin/ui-*), adapters remain internal
- Section II: Updated package references to new namespace
- Section III: Changesets now only for builder app and adapters
- Section IV: Updated styles package reference
- Section V: Exported apps use @openzeppelin/ui-* packages
- Section VII: Updated utility package references
- Additional Constraints: Updated package references
- Development Workflow: Added pnpmfile-based local dev workflow
Templates:
- ✅ .specify/templates/plan-template.md
Follow-up TODOs: none
-->

# UI Builder Constitution

## Core Principles

### I. Chain-Agnostic Core, Adapter-Led Architecture (NON-NEGOTIABLE)

- Core UI packages (`@openzeppelin/ui-types`, `@openzeppelin/ui-utils`,
  `@openzeppelin/ui-styles`, `@openzeppelin/ui-components`, `@openzeppelin/ui-renderer`,
  `@openzeppelin/ui-react`, `@openzeppelin/ui-storage`) are maintained in the
  separate `openzeppelin-ui` monorepo and consumed via npm.
- The builder app (`apps/builder`) and adapter packages (`packages/adapter-*`)
  remain in this repository.
- All chain-specific logic, dependencies, and polyfills live exclusively in adapter
  packages (`packages/adapter-*`).
- Adapters MUST implement `ContractAdapter` from `@openzeppelin/ui-types` and be
  instantiated with a `NetworkConfig`.
- The builder MUST resolve adapters through dynamic ecosystem registration via the
  ecosystem manager (`apps/builder/src/core/...`).
- Adapter packages MUST NOT declare chain-specific dependencies in chain-agnostic
  imports; they own their network concerns.
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
  `@openzeppelin/ui-utils` instead (exceptions only in tests, stories, or
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
- Versioning relies on Changesets for the builder app and adapter packages; core
  UI packages are versioned independently in the `openzeppelin-ui` repository.
- CI publishes releases on merge to `main` after tests, linting, and type checks pass.
- Shared configs (`tailwind.config.cjs`, `postcss.config.cjs`, `components.json`)
  are consumed via lightweight proxies.
- Rationale: Maintains reproducible builds, consistent release automation, and
  eliminates tooling drift.

### IV. UI/Design System Consistency (NON-NEGOTIABLE)

- A single design system governs the builder, renderer, and exported apps.
- Styling leverages Tailwind CSS v4 with shadcn/ui primitives via
  `@openzeppelin/ui-styles` and root configs.
- Use the `cn` utility from `@openzeppelin/ui-utils` for class composition.
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
- Exported apps use `@openzeppelin/ui-*` packages (not `ui-builder-*`); version
  strategy varies by environment: local uses `file:` for tarballs, staging uses
  RC versions, production uses stable npm versions.
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
- Extending adapter interfaces in `@openzeppelin/ui-types` requires coordinating
  with the `openzeppelin-ui` repository maintainers and updating associated lint
  rules (e.g., `no-extra-adapter-methods`).
- Shared logic across adapters belongs in `@openzeppelin/ui-utils` or
  `@openzeppelin/ui-types`; avoid duplication of chain-agnostic behavior.
- Document reuse decisions in specs and plans; reviewers enforce compliance with
  this principle.
- Rationale: Minimizes redundancy, keeps abstractions aligned, and streamlines
  onboarding.

## Additional Constraints

- Do not add chain-specific code or polyfills to chain-agnostic imports;
  adapters own network concerns.
- Data schemas and shared types have a single source of truth in
  `@openzeppelin/ui-types`.
- Prefer shared utilities from `@openzeppelin/ui-utils` (e.g., `logger`,
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
- **Local UI development**: Run `pnpm dev:local` to resolve `@openzeppelin/ui-*`
  packages to local paths in `../openzeppelin-ui` via `.pnpmfile.cjs`. Run
  `pnpm dev:npm` to switch back to npm packages. This keeps `package.json`
  unchanged while enabling seamless local development.
- **Docker testing**: Run `pnpm docker:dev` to build and run the Docker container
  locally.
- Commit messages follow Conventional Commits and pass commitlint; Commitizen
  (`pnpm commit`) is available.
- Before opening a PR, ensure tests, type checks, and linting pass
  workspace-wide; include a Changeset for public package changes (builder app
  and adapters only).
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

**Version**: 1.3.0 | **Ratified**: 2025-09-17 | **Last Amended**: 2026-01-06
