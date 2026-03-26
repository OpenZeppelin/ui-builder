# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

OpenZeppelin UI Builder — a pnpm monorepo (Node ≥20.19.0, pnpm 10.28.2) containing a client-side React/Vite SPA that generates front-end UIs for smart contract interactions across multiple blockchain ecosystems (EVM, Stellar, Polkadot, Midnight, Solana). No backend, database, or external infrastructure is required.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite dev server | `pnpm dev` | 5173 | Main app; requires `pnpm build` first to build adapter packages |

### Key commands

Refer to the `scripts` section of the root `package.json` and the README for the full list. Highlights:

- **Install**: `pnpm install`
- **Build all packages**: `pnpm build` (must run before `pnpm dev`; builds adapter packages + builder app)
- **Dev server**: `pnpm dev` (opens at http://localhost:5173)
- **Lint**: `pnpm lint`
- **Test**: `pnpm test` (runs Vitest across all workspace packages)
- **Format + lint fix**: `pnpm fix-all`

### Non-obvious caveats

- **Build before dev**: You must run `pnpm build` at least once before `pnpm dev` because adapter packages under `packages/*` must be built before the Vite dev server can resolve their exports.
- **Ignored build scripts warning**: `pnpm install` may show a warning about ignored build scripts (esbuild, protobufjs, etc.). This is expected and does not affect functionality — the project uses `pnpm.onlyBuiltDependencies` implicitly.
- **adapter-evm test flakiness**: 2 tests in `packages/adapter-evm/test/access-control-integration.test.ts` fail with "HTTP request failed" due to viem's HTTP transport not being properly mocked in the happy-dom test environment. This is a pre-existing issue, not caused by setup.
- **Husky hooks**: Pre-commit runs `pnpm fix-all` on staged files. Pre-push runs `pnpm fix-all`, `pnpm lint:adapters`, and `pnpm update-export-versions`. Set `CI=true` to skip the commit-msg hook if needed.
- **API keys are optional**: The app runs fully without Etherscan, Routescan, or WalletConnect API keys. Block explorer ABI auto-fetch won't work without them, but manual ABI paste works fine.
- **Contract ABI can be fetched from Sourcify**: Even without Etherscan API keys, the app can fetch ABIs from Sourcify for verified contracts.
