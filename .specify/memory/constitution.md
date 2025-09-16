# Contracts UI Builder Constitution

## Core Principles

### I. Chain‑Agnostic Core, Adapter‑Led Architecture (NON‑NEGOTIABLE)

The builder app (`packages/builder`), renderer (`packages/renderer`), UI components (`packages/ui`), utils (`packages/utils`), react-core (`packages/react-core`), storage (`packages/storage`), styles (`packages/styles`), and shared types (`packages/types`) are chain‑agnostic. All chain‑specific logic, dependencies, polyfills, and network handling live exclusively in adapter packages (`packages/adapter-*`).

- Adapters implement `ContractAdapter` from `packages/types/src/adapters/base.ts` and are instantiated with a specific `NetworkConfig` (network‑aware).
- The EVM adapter is the architectural template; new adapters must mirror its structure, naming, and patterns. The Stellar adapter mirrors EVM exactly where applicable.
- The builder must not directly import adapter packages; use dynamic ecosystem registration/lookup via the ecosystem manager (`packages/builder/src/core/...`).
- Chain‑agnostic packages must not declare chain‑specific dependencies.
- Validation has a single source of truth on the adapter interface. `isValidAddress(address: string, addressType?: string)` allows chain‑specific granularity (EVM ignores `addressType`; Stellar uses it).

### II. Type Safety, Linting, and Code Quality (NON‑NEGOTIABLE)

TypeScript strictness and uniform linting/formatting are enforced monorepo‑wide.

- Disallow `console` in source code; use the shared `logger` from `@openzeppelin/contracts-ui-builder-utils`. Console usage is allowed only in tests/stories/explicit script overrides.
- Default logging is disabled outside development; enable only when necessary via `logger.configure({ enabled: true, level })`.
- Disallow `any` types; prefer precise types and generics. Do not suppress type errors without justification.
- No extra adapter methods beyond the base interface are allowed; enforced by custom lint rule when available.
- Follow root ESLint/Prettier configs; do not add package‑level `.prettierrc`.
- Always run `pnpm fix-all` before commits to ensure Prettier then ESLint ordering (including Tailwind class sorting).
- Import ordering and unused imports are enforced by lint rules.
- Public APIs in libraries require JSDoc as configured.

### III. Tooling, Packaging, and Releases (NON‑NEGOTIABLE)

The monorepo standardizes on pnpm, tsup, and Changesets with consistent outputs.

- Package manager: pnpm only (enforced via `preinstall` and CI). Use `pnpm -r` for workspace operations.
- Build: `tsup` for bundling + `tsc --emitDeclarationOnly` for types; ship both ESM and CJS where applicable.
- Versioning/Release: Changesets governs version bumps and changelogs; CI produces version PRs and publishes to npm on merge to `main`.
- CI must pass tests, linting, and type checks for all packages.
- Centralized configs (root `tailwind.config.cjs`, `postcss.config.cjs`, `components.json`) are consumed via lightweight proxies in packages.

### IV. UI/Design System Consistency (NON‑NEGOTIABLE)

A single design system governs all UI across builder, renderer, and exported apps.

- Tailwind CSS v4 with shadcn/ui primitives; styling derives from `@openzeppelin/contracts-ui-builder-styles` and root configs.
- Use the `cn` utility from `@openzeppelin/contracts-ui-builder-utils` for composing class names.
- Prefer `lucide-react` icons; do not use emojis in UI. Prefer existing SVG assets or lucide icons over inline raw SVG.
- Use standard Tailwind size tokens; avoid arbitrary values unless justified by the design system.
- Form spacing and layout follow the documented patterns (e.g., `flex flex-col gap-2`, `space-y-*`).

### V. Testing, Documentation, and Exported Apps (NON‑NEGOTIABLE)

Quality gates and exports must remain consistent and reproducible.

- Tests: Vitest for unit/integration; Storybook for component docs/visual checks; coverage tracked in CI.
- Documentation: Keep adapter docs and high‑level architecture current when adding ecosystems or changing interfaces.
- Exported apps: The export pipeline must produce standalone React + Vite apps. Runtime config is provided via `AppConfigService` (env in builder, `public/app.config.json` in exports). Local exports use `workspace:*`; production exports use published `latest` versions.
- Features must be gated with feature flags where indicated by ecosystem readiness.

### VI. Test‑Driven Development for Business Logic (NON‑NEGOTIABLE)

TDD is required across non‑UI code. UI components are explicitly exempt.

- Business logic (functions, services, adapters, validators, data transforms, storage, ecosystem manager, networking) MUST follow TDD: write a failing test first, then implement the minimal code to pass, then refactor.
- UI components implemented in `.tsx` files are EXEMPT from TDD. Prefer Storybook, visual checks, and interaction tests when appropriate.
- PRs that change business logic must include corresponding unit/integration tests created first (or updated first) demonstrating the behavior.
- Vitest remains the standard test runner; use mocking only where necessary to keep tests focused and fast.

## Additional Constraints

- Do not add chain‑specific code or polyfills in chain‑agnostic packages (e.g., no `globalThis.Buffer` in the builder); adapters must own such concerns.
- When extending `packages/types/src/adapters/base.ts`, update any corresponding no‑extra‑adapter‑methods configuration to keep lint rules in sync.
- Single source of truth for data schemas and shared types lives in `packages/types`; avoid duplication.
- Prefer shared utilities from `@openzeppelin/contracts-ui-builder-utils` (e.g., `logger`, `AppConfigService`, `cn`, ID generation) over ad‑hoc implementations. Use lodash’s `debounce` where debouncing is needed.
- Security: Do not hardcode secrets; use runtime configuration. Follow security checks in CI.
- Avoid noisy logging in application code; prefer traceability via structured, level‑based logs only when debugging or investigating issues.
- Contract comparisons must operate on raw contract definitions (ABI/IDL/etc.), not on internal `ContractSchema` representations.

## Development Workflow and Review Process

- Use `pnpm` for all tasks (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm -r format:check`, `pnpm fix-all`).
- Commit messages follow Conventional Commits and pass commitlint. Commitizen (`pnpm commit`) is available.
- Before opening a PR: ensure tests, type checks, and linting pass across the workspace; include a Changeset for public package changes.
- Adapter contributions must follow the Adapter Architecture Guide: network‑aware constructor, exports, ecosystem registration, and strict interface compliance.
- Code review ensures adherence to this constitution, architecture boundaries, and design system.

## Governance

This constitution supersedes other practices for architectural, quality, and workflow standards. Non‑negotiable rules above must be enforced during development and review.

- Amendments require: a documented proposal, updates to relevant guides/READMEs, migration notes if needed, and approval via PR review.
- Breaking changes require a Changeset with a major bump and clear upgrade notes; commit messages must indicate breaking changes per convention.
- CI must enforce these rules; PRs that violate them should be rejected or corrected.

Amendment History:

- 2025-09-16 (v1.1.0): Declared TDD as non‑negotiable for business logic; explicitly exempted `.tsx` UI components.
- 2025-09-16 (v1.0.1): Added README/CONTRIBUTING links, clarified logging defaults and `no any`, added raw contract comparison constraint.

**Version**: 1.1.0 | **Ratified**: 2025-09-16 | **Last Amended**: 2025-09-16
