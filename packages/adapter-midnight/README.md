# Midnight Network Adapter

A browser-based adapter for executing Midnight smart contracts in the OpenZeppelin Contracts UI Builder. This adapter enables users to upload Midnight contract artifacts, interact with contracts through the Lace wallet, and execute zero-knowledge proof transactions entirely in the browser.

## Features

- ✅ **Pure Client-Side Execution** - No backend server required
- ✅ **ZIP Upload Workflow** - Simple contract artifact loading
- ✅ **Zero-Knowledge Proofs** - Integrated proof generation via proof server
- ✅ **Lace Wallet Integration** - Native Midnight wallet support
- ✅ **Production Ready** - Static deployment identical to EVM/Stellar adapters

## Quick Start

### 1. Upload Contract Artifacts

Export your Midnight contract as a ZIP file containing:

- Contract definition (`.d.ts` or `.d.cts`)
- Compiled contract module (`.cjs` or `.js`)
- Witness code (`witnesses.js`)
- ZK artifacts (`.prover`, `.verifier`, `.bzkir`)

```bash
cd your-midnight-contract
compact build
zip -r contract.zip dist/
```

### 2. Load in UI Builder

1. Navigate to Midnight network in the UI Builder
2. Click "Upload Contract"
3. Select your `contract.zip` file
4. Contract functions will automatically populate

### 3. Execute Transactions

1. Connect Lace wallet
2. Select a contract function
3. Enter parameters
4. Click "Execute" - proof generation and signing handled automatically

### Runtime-Only Organizer Secret (Organizer-Only Circuits)

Some circuits require an organizer secret key. For security, the adapter treats this as a runtime-only credential:

- Never requested or stored during artifact upload
- Collected only at execution time (similar to a relayer API key)
- Injected into the private state provider in-memory and never persisted

How it works in the UI:

- The Builder auto-adds a form field of type `runtimeSecret` for functions that require an organizer key (based on adapter-provided decorations).
- This field appears in the form like any other field (not in the execution settings panel). The label and helper text are adapter-defined (e.g., "Organizer Secret Key (hex)").
- Values from `runtimeSecret` fields are never persisted; they are removed from contract arguments and passed to the adapter at submit time.
- The adapter seeds a runtime-only overlay of the private state so the secret is available just-in-time for proof generation and is stripped on any persistence operations.

## Architecture

This adapter implements a pure browser-based solution with **lazy-loaded polyfills**:

```
Browser Memory
├── ZIP Extraction (jszip)
├── ZK Artifacts (EmbeddedZkConfigProvider)
├── Contract Evaluation (dynamic code execution)
├── Browser Polyfills (lazy-loaded when adapter imports)
│   ├── Buffer Polyfill (runtime, via browser-init.ts)
│   └── CommonJS Polyfill (runtime, via browser-init.ts)
└── Transaction Execution (direct SDK integration)
```

**Key Components:**

- **EmbeddedZkConfigProvider**: In-memory storage for prover/verifier keys
- **Contract Evaluator**: Dynamic contract instantiation with shared WASM context
- **Browser Init**: Lazy-loaded polyfills (Buffer + CommonJS) only when Midnight is selected
- **Monkey Patches**: Minimal SDK patches for browser compatibility (see [`patches/`](../../patches/))

### Browser Compatibility Strategy

The adapter uses **lazy-loaded runtime polyfills** to minimize global namespace pollution:

**Runtime Polyfills** - Installed when adapter is first imported

- Buffer polyfill for `@dao-xyz/borsh` (Midnight SDK serialization)
- CommonJS globals for dynamic contract evaluation
- Location: `packages/adapter-midnight/src/browser-init.ts`
- Only loads when user selects Midnight ecosystem

**Why This Works:**

- Polyfills install before any Midnight SDK code executes
- No impact on other ecosystems (EVM, Solana, Stellar)
- Vite's `NodeGlobalsPolyfillPlugin` provides additional Buffer support during dependency optimization

## Exported Applications

When you export an application from the UI Builder, **all contract artifacts are automatically bundled** into the exported app. This enables:

- ✅ **ZK Proof Generation**: All proof files included
- ✅ **Contract State Queries**: TypeScript definitions preserved
- ✅ **Self-Contained Deployment**: Deploy anywhere without external dependencies

### What Gets Exported

The export process uses a **lean bundling approach** that keeps files small:

**Bundled in the Export:**

1. **Original ZIP file**: Stored at `public/midnight/contract.zip` (keeps bundle small)
2. **Contract Address**: Deployed contract address
3. **Private State ID**: Contract's private state identifier

**Parsed at Runtime (from ZIP):**

- Contract definition (TypeScript `.d.ts` interface)
- Contract module (`.cjs` for contract interaction)
- Witness code (`witnesses.js` for zero-knowledge proofs)
- Verifier keys (`.prover`/`.verifier` for proof verification)
- ZK artifacts (for browser-based proof generation)

This approach:

- ✅ Keeps exported files small (no massive expanded artifacts)
- ✅ Reuses the same ZIP parsing logic as the builder
- ✅ Maintains a single source of truth for artifact handling
- ✅ Makes exports future-proof to ZIP format changes

### Exported App Structure

```
exports/your-app/
├── src/
│   ├── midnight/
│   │   └── artifacts.ts          # ← ZIP data + metadata
│   ├── main.tsx                   # ← Auto-loads and parses ZIP on startup
│   ├── App.tsx
│   └── components/
│       └── GeneratedForm.tsx
├── package.json                    # ← Includes all Midnight dependencies
└── vite.config.ts                  # ← Configured for WASM & module deduplication
```

The exported `main.tsx` automatically loads artifacts during adapter initialization:

```typescript
const resolveAdapter = async (nc: NetworkConfig): Promise<ContractAdapter> => {
  const adapter = new MidnightAdapter(nc);
  // Load contract from URL-based ZIP (same parsing logic as builder)
  await adapter.loadContractWithMetadata(midnightArtifactsSource);
  return adapter;
};
```

The `artifacts.ts` file contains the ZIP metadata and URL:

```typescript
export const midnightArtifactsSource = {
  contractAddress: '0x...',
  privateStateId: 'counter',
  contractArtifactsUrl: '/midnight/contract.zip',
};
```

### Testing Exported Apps

**Important:** When testing exported Midnight apps, you **must** test them **outside** the UI Builder monorepo workspace.

```bash
# ❌ WRONG - Running in monorepo (patches won't apply)
cd /path/to/ui-builder/exports/my-app
pnpm install  # Patches from adapter are ignored in nested workspaces!
pnpm dev

# ✅ CORRECT - Copy to external directory first
cp -r exports/my-app ~/Desktop/my-app
cd ~/Desktop/my-app
pnpm install  # Now patches will be applied correctly
pnpm dev
```

**Why?** pnpm only applies patches from `pnpm.patchedDependencies` when installing published packages. In a monorepo, patches must be defined at the workspace root. The adapter's bundled patches are only activated when the adapter is installed from npm (not via `workspace:*`).

**What happens if you test in the monorepo?**

- Midnight SDK patches won't be applied
- You may see errors like "No private state found" or module resolution issues
- Transaction execution will fail unexpectedly

**For CI/CD or production deployments:** This is not an issue. Published apps install the adapter from npm, which automatically applies all patches.

1. **Export from Builder**: Use the "Export" button after loading a contract
2. **Install Dependencies**: `cd exports/your-app && npm install`
3. **Run Locally**: `npm run dev`
4. **Execute Transaction**: Connect Lace wallet and submit a transaction
5. **Verify Offline**: Artifacts load instantly without network requests

For more on the export architecture, see [`docs/ADAPTER_ARCHITECTURE.md § 11.6`](../../docs/ADAPTER_ARCHITECTURE.md#116-including-adapter-artifacts-in-exported-apps).

## Documentation

This adapter includes comprehensive documentation covering all aspects of the Midnight integration:

### 📚 Core Documentation

- **[TRANSACTION_IMPLEMENTATION.md](./TRANSACTION_IMPLEMENTATION.md)** - Complete implementation guide covering architecture, data flow, WASM context isolation, Buffer polyfills, ZK artifact distribution, SDK patches, and testing guidelines.

- **[TYPE-COVERAGE.md](./TYPE-COVERAGE.md)** - Comprehensive type system reference with full coverage analysis of all Midnight types, UI component mappings, validation status against production contracts, and edge case handling.

- **[BROWSER_COMPATIBILITY.md](./BROWSER_COMPATIBILITY.md)** - Browser compatibility strategy, polyfill implementation details, global namespace management, and debugging tips for browser-specific issues.

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history, breaking changes, new features, and migration guides for adapter updates.

### 🔧 Component Documentation

- **[Wallet Integration](./src/wallet/README.md)** - Lace wallet connection, state management, and provider configuration.

### 📖 Quick Reference

| Topic            | Document                      | Key Sections                       |
| ---------------- | ----------------------------- | ---------------------------------- |
| Getting Started  | This README                   | Quick Start, Architecture, Export  |
| Transaction Flow | TRANSACTION_IMPLEMENTATION.md | §4-7: Providers, Execution, Proofs |
| Type Mapping     | TYPE-COVERAGE.md              | Type Matrix, UI Components         |
| Browser Setup    | BROWSER_COMPATIBILITY.md      | Polyfills, CommonJS Support        |
| Wallet Setup     | src/wallet/README.md          | Connection, State, Errors          |

## Requirements

- **Browser**: Modern browser with WebAssembly support
- **Wallet**: Lace wallet browser extension
- **Contract**: Midnight contract compiled with Compact compiler v0.9.0+

> **Note**: This adapter automatically installs browser polyfills (Buffer, CommonJS) when loaded. No additional setup required.

## Known Limitations

1. **Page Reload**: Artifacts cleared on refresh (re-upload ZIP file)
2. **Memory Usage**: ~500KB-1MB per circuit stored in browser
3. **Single Contract**: One contract's artifacts at a time per session
4. **Proof Server**: Requires external proof generation service

## Dependencies

**Core**:

- `@midnight-ntwrk/compact-runtime` - Contract runtime
- `@midnight-ntwrk/midnight-js-contracts` - Contract utilities
- `@midnight-ntwrk/midnight-js-http-client-proof-provider` - Proof server client
- `@midnight-ntwrk/midnight-js-level-private-state-provider` - Private state storage
- `jszip` - ZIP file extraction

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## File Structure

```
src/
├── index.ts                          # Entry point + polyfill loader
├── browser-init.ts                   # Runtime polyfills (Buffer + CommonJS)
├── adapter.ts                        # Main adapter implementation
├── networks/
│   └── testnet.ts                   # Network configurations
├── transaction/
│   ├── eoa.ts                       # Transaction execution strategy
│   ├── providers.ts                 # SDK provider configuration
│   ├── embedded-zk-config-provider.ts # In-memory ZK artifact storage
│   ├── contract-evaluator.ts       # Dynamic contract loading
│   └── witness-evaluator.ts        # Witness code evaluation
└── utils/
    ├── artifacts.ts                 # Artifact validation & registration
    ├── zip-extractor.ts             # ZIP parsing logic
    └── schema-parser.ts             # Contract interface parsing
```

## Troubleshooting

### Transaction Fails with Version Error

**Cause**: Prover keys compiled with incompatible Compact compiler version.

**Solution**: Recompile contract with current Compact compiler:

```bash
cd your-contract
pnpm install @midnight-ntwrk/compact-cli@latest
compact build
```

### "Module not found" Error

**Cause**: Missing contract artifacts in ZIP file.

**Solution**: Ensure ZIP contains `dist/` directory with all compiled outputs.

### Proof Generation Timeout

**Cause**: Network issues or proof server overload.

**Solution**:

- Check network connection
- Verify proof server URL in wallet config
- Try again after a few minutes

## Contributing

When modifying this adapter:

1. **Test thoroughly** - Midnight integration is complex
2. **Update docs** - Keep TRANSACTION_IMPLEMENTATION.md current
3. **Maintain patches** - Document any SDK monkey-patches
4. **Consider upstream** - Submit fixes to Midnight SDK when possible

## Resources

- [Midnight Documentation](https://docs.midnight.network/)
- [Compact Language](https://docs.midnight.network/develop/compact/)
- [Midnight SDK Reference](https://docs.midnight.network/develop/sdk/)
- [Lace Wallet](https://www.lace.io/)

## License

MIT
