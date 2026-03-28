# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

OpenZeppelin UI Builder — a pnpm monorepo (Node ≥20.19.0, pnpm 10.28.2) containing a client-side React/Vite SPA that generates front-end UIs for smart contract interactions across multiple blockchain ecosystems (EVM, Stellar, Polkadot, Midnight, Solana). No backend, database, or external infrastructure is required.

Adapter packages (`@openzeppelin/adapter-*`) have been extracted to a separate repo: [openzeppelin-adapters](https://github.com/OpenZeppelin/openzeppelin-adapters). This repo consumes them as published npm packages. For local adapter development, clone the sibling repo and use `pnpm dev:adapters:local` (see `docs/LOCAL_DEVELOPMENT.md`).

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite dev server | `pnpm dev` | 5173 | Main app; requires `pnpm build` first |

### Key commands

Refer to the `scripts` section of the root `package.json` and the README for the full list. Highlights:

- **Install**: `pnpm install`
- **Build**: `pnpm build` (must run before `pnpm dev`)
- **Dev server**: `pnpm dev` (opens at http://localhost:5173)
- **Lint**: `pnpm lint`
- **Test**: `pnpm test` (runs Vitest for the builder app + script tests)
- **Format + lint fix**: `pnpm fix-all`
- **Local adapter dev**: `pnpm dev:adapters:local` (requires sibling `../openzeppelin-adapters` clone)
- **Local UI kit dev**: `pnpm dev:uikit:local` (requires sibling `../openzeppelin-ui` clone)

### Non-obvious caveats

- **Build before dev**: You must run `pnpm build` at least once before `pnpm dev` so the Vite dev server can resolve built outputs.
- **Ignored build scripts warning**: `pnpm install` may show a warning about ignored build scripts (esbuild, protobufjs, etc.). This is expected and does not affect functionality.
- **Husky hooks**: Pre-commit runs `pnpm fix-all` on staged files. Pre-push runs `pnpm fix-all` and `pnpm update-export-versions`. Set `CI=true` to skip the commit-msg hook if needed.
- **API keys are optional**: The app runs fully without Etherscan, Routescan, or WalletConnect API keys. Block explorer ABI auto-fetch won't work without them, but manual ABI paste works fine.
- **Contract ABI can be fetched from Sourcify**: Even without Etherscan API keys, the app can fetch ABIs from Sourcify for verified contracts.
- **Adapter packages are external**: `packages/adapter-*` directories are excluded from the pnpm workspace (`pnpm-workspace.yaml`). Any leftover `packages/adapter-*` paths on disk are build artifacts, not workspace packages.
