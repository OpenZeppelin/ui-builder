<!--
Sync Impact Report
Version: 1.5.0 → 1.5.1
Modified Principles:
- II. Type Safety, Linting, and Code Quality (console exception wording)
- V. Testing, Documentation, and Exported Apps (removed Storybook)
- VI. Test-Driven Development for Business Logic (UI verification via tests only)
Summary of Changes:
- Removed Storybook from this repository; component and UI verification relies on
  Vitest and Testing Library (and coverage in CI) instead.
Templates:
- ✅ .specify/templates/* (unchanged)
Runtime docs:
- ✅ README.md (Storybook removed)
- ✅ .cursor/rules/tech-stack-rule.mdc, core-package.mdc
Follow-up TODOs:
- None
-->

# UI Builder Constitution

## Core Principles

### I. Chain-Agnostic Core, Adapter-Led Architecture (NON-NEGOTIABLE)

- Core UI packages (`@openzeppelin/ui-types`, `@openzeppelin/ui-utils`,
  `@openzeppelin/ui-styles`, `@openzeppelin/ui-components`, `@openzeppelin/ui-renderer`,
  `@openzeppelin/ui-react`, `@openzeppelin/ui-storage`) are maintained in the
  separate `openzeppelin-ui` monorepo and consumed via npm.
- The builder app (`apps/builder`) remains in this repository.
- Ecosystem adapter packages are maintained in the dedicated
  `openzeppelin-adapters` monorepo and consumed by Builder and other products via
  published packages or approved local-repo overrides during development.
- All chain-specific logic, dependencies, and polyfills live exclusively in adapter
  packages (`packages/adapter-*` in the adapter monorepo).
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
  `@openzeppelin/ui-utils` instead (exceptions only in tests or scripts).
- Logging is disabled by default outside development; enable explicitly via
  `logger.configure({ enabled: true, level })`.
- `any` types are disallowed without explicit justification; prefer precise
  generics.
- Public library APIs MUST include JSDoc annotations as configured.
- Rationale: Enforces consistent quality gates that prevent regressions and
  ensures actionable diagnostics across packages.

### III. Tooling, Packaging, and Releases (NON-NEGOTIABLE)

- `pnpm` is the sole package manager; use `pnpm -r` for workspace commands.
- The Builder application (`apps/builder`) builds with the repository-standard Vite
  stack. This repository does **not** publish npm packages; the app is private and
  ships through container deployment (staging and production workflows).
- Published `@openzeppelin/ui-*` and `@openzeppelin/adapter-*` dependencies are
  resolved from the npm registry (or local overrides per the development workflow).
- Core UI packages are versioned and released from the `openzeppelin-ui`
  repository using its own release process.
- Adapter packages are versioned and released from the `openzeppelin-adapters`
  repository (including RC and stable channels as defined there).
- `ui-builder` owns Builder CI quality gates, staging and production deployment
  orchestration, and keeping export metadata
  (`apps/builder/src/export/versions.ts` and related checks) aligned with
  resolved published versions.
- CI MUST run automated tests, linting, and type checks on pull requests and
  appropriate `main` branch events; merge criteria follow team policy.
- Shared configs (`tailwind.config.cjs`, `postcss.config.cjs`, `components.json`)
  are consumed via lightweight proxies.
- Rationale: Matches automation to an application-only repository while keeping
  library publication boundaries clear.

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

- Vitest is the standard for unit and integration tests; use Testing Library for
  component behavior where appropriate.
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
- UI components in `.tsx` files are exempt but should use interaction tests
  (e.g., Testing Library) where feasible.
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
- **Local UI development**: Run `pnpm dev:local` to use the shared `oz-dev`
  workflow backed by the checked-in `.openzeppelin-dev.json` and
  `.pnpmfile.cjs` files. Run `pnpm dev:npm` to switch back to published npm
  packages without rewriting committed dependencies.
- **Local adapter development**: Use the canonical `LOCAL_ADAPTERS_PATH`
  convention when resolving `@openzeppelin/adapter-*` packages from a sibling
  checkout of `../openzeppelin-adapters`. Compatibility aliases may exist
  temporarily during migration, but repository docs must converge on the
  canonical variable.
- **Docker testing**: Run `pnpm docker:dev` to build and run the Docker container
  locally.
- Commit messages follow Conventional Commits and pass commitlint; Commitizen
  (`pnpm commit`) is available.
- Before opening a PR, ensure tests, type checks, and linting pass
  workspace-wide. Changes that affect exported dependency pins MUST run
  `pnpm update-export-versions` and commit updated `versions.ts` (and snapshot
  tests when applicable) so **Check Version Sync** and related CI checks pass.
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
- Repository-boundary changes affecting adapter ownership, release automation, or
  local-development contracts MUST be ratified here before implementation PRs are
  merged.
- Breaking changes to export contracts, the export CLI, or other documented
  consumer integration surfaces MUST include migration notes in the PR and use
  conventional commits (e.g., `feat!`, `BREAKING CHANGE:`) for visibility. Library
  packages consumed from other OpenZeppelin repositories follow those repositories’
  versioning policies.
- CI enforces compliance; PRs violating constitutional rules MUST be corrected
  before merge.

**Version**: 1.5.1 | **Ratified**: 2025-09-17 | **Last Amended**: 2026-03-27
