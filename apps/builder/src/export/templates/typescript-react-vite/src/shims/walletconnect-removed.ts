/**
 * Stub for the WalletConnect provider that `@wagmi/connectors` dynamically imports.
 *
 * WalletConnect support was removed (its provider pulls in `@reown/appkit`, which
 * moved to the Reown Community License at 1.8.3), and `.pnpmfile.cjs` strips
 * `@walletconnect/ethereum-provider` from the install tree. `@wagmi/connectors`
 * still re-exports its `walletConnect` connector, whose module contains
 * `await import('@walletconnect/ethereum-provider')`. Rollup resolves dynamic
 * imports at build time even when the call site is unreachable, so without this
 * alias the production build fails with "failed to resolve import".
 *
 * Nothing registers that connector, so this module is never evaluated. It throws
 * rather than returning a fake provider so that any future accidental use is loud.
 */

function walletConnectRemoved(): never {
  throw new Error(
    'WalletConnect support was removed from this application. Use an injected wallet, MetaMask or Safe.'
  );
}

export const EthereumProvider = {
  init: walletConnectRemoved,
};

export default EthereumProvider;
