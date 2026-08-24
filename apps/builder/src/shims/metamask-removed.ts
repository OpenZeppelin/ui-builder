/**
 * Stub for the MetaMask SDK that `@wagmi/connectors` dynamically imports.
 *
 * `@metamask/sdk` is not open source: it ships a proprietary ConsenSys licence
 * granting only a non-exclusive, non-transferable licence for Non-Commercial Use,
 * whose clause 2 requires any derivative to carry that same restriction forward.
 * That cannot be reconciled with AGPL-3.0, which forbids conveying the work under
 * added restrictions, so `.pnpmfile.cjs` strips it from the install tree.
 *
 * `@wagmi/connectors` still re-exports its `metaMask` connector, whose module
 * contains `await import('@metamask/sdk')`. Rollup resolves dynamic imports at
 * build time even when the call site is unreachable, so without this alias the
 * production build fails with "failed to resolve import".
 *
 * Nothing registers that connector, so this module is never evaluated. It throws
 * rather than returning a fake SDK so that any future accidental use is loud.
 *
 * The connector unwraps the import as `const { default: SDK } = await import(...)`
 * and then calls `new SDK({...})`, so the default export must be constructible.
 */

class MetaMaskSdkRemoved {
  constructor() {
    throw new Error(
      'The MetaMask SDK was removed from this application for licence reasons ' +
        '(proprietary, Non-Commercial Use only). The MetaMask browser extension is ' +
        'still available through the injected connector and EIP-6963 discovery; ' +
        'MetaMask mobile deep-link / QR pairing is not.'
    );
  }
}

export default MetaMaskSdkRemoved;
