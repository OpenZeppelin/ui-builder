/**
 * pnpm hook for this exported application.
 *
 * Removes the Trezor packages that @creit.tech/stellar-wallets-kit declares as
 * hard dependencies. They are licensed under the Trezor Reference Source License
 * (T-RSL), which grants "reference use" within a single company and excludes the
 * right to redistribute, so they are stripped rather than installed.
 *
 * Nothing in a generated app reaches that code: the kit's barrel does not
 * re-export modules/trezor.module, and allowAllModules() -- which the generated
 * wallet configuration uses -- returns only the eight non-Trezor modules
 * (Albedo, Freighter, Rabet, xBull, Lobstr, Hana, HotWallet, Klever). Trezor is
 * therefore not an offered wallet option, with or without this hook.
 *
 * Keying on the kit's own manifest keeps this independent of the kit version and
 * of how deeply the kit is pulled in.
 *
 * Note: this hook is honoured by pnpm only. Installing with npm or yarn will
 * still place the T-RSL packages in node_modules (unused, but present), so
 * prefer pnpm -- which is also what this project's .npmrc hoist patterns assume.
 */

const TREZOR_DEP_HOST = '@creit.tech/stellar-wallets-kit';
const TREZOR_DEPS = ['@trezor/connect-web', '@trezor/connect-plugin-stellar'];
const TREZOR_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripTrezorDependencies(pkg, context) {
  if (pkg.name !== TREZOR_DEP_HOST) {
    return;
  }

  for (const field of TREZOR_DEP_FIELDS) {
    for (const dep of TREZOR_DEPS) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (T-RSL)`);
      }
    }
  }
}

// --- License compliance: strip the WalletConnect / Reown stack ---------------
// We no longer register a WalletConnect connector in any ecosystem, so these
// dependencies are dead weight -- and the EVM one drags in @reown/appkit.
//
// Reown moved AppKit to the Reown Community License at 1.8.3 (commercial fees
// above 500 monthly active users, a mandatory-gateway clause and a
// confidentiality clause). The wagmi team have themselves deprecated their
// walletConnect connector over that relicence, noting they cannot patch a known
// downstream vulnerability (pino@7.11.0) because of it.
//
// Both host packages reach WalletConnect through a single isolated module that
// nothing else imports:
//   - @wagmi/connectors                -> walletConnect.js (dynamic import, unused)
//   - @creit.tech/stellar-wallets-kit   -> modules/walletconnect.module (not in the
//     barrel, not in allowAllModules())
// @wagmi/connectors@8+ makes its WalletConnect dependency an optional peer; until
// we move to wagmi 3 this hook achieves the same on the version we pin.
const WALLETCONNECT_STRIP = {
  '@wagmi/connectors': ['@walletconnect/ethereum-provider'],
  '@creit.tech/stellar-wallets-kit': ['@walletconnect/modal', '@walletconnect/sign-client'],
};
const WALLETCONNECT_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripWalletConnectDependencies(pkg, context) {
  const deps = WALLETCONNECT_STRIP[pkg.name];
  if (!deps) {
    return;
  }

  for (const field of WALLETCONNECT_DEP_FIELDS) {
    for (const dep of deps) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (WalletConnect)`);
      }
    }
  }
}

// --- License compliance: strip the MetaMask SDK -----------------------------
// @metamask/sdk ships a proprietary ConsenSys licence, not an open-source one:
// "Copyright ConsenSys Software Inc. 2022. All rights reserved", granting only a
// licence for Non-Commercial Use, and requiring any derivative to carry that same
// restriction forward. The OpenZeppelin adapters are AGPL-3.0, which forbids
// conveying the work under added restrictions, so the two cannot both be
// satisfied. No published version declares a `license` field at all.
//
// @wagmi/connectors declares it as a hard dependency, not an optional peer, so it
// installs whether or not a metaMask() connector is registered.
//
// Scoped to this one name on purpose: most of @metamask/* is MIT or ISC and is
// legitimately needed, so a scope-wide strip would break far more than it fixes.
const METAMASK_STRIP = {
  '@wagmi/connectors': ['@metamask/sdk'],
};
const METAMASK_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripMetaMaskDependencies(pkg, context) {
  const deps = METAMASK_STRIP[pkg.name];
  if (!deps) {
    return;
  }

  for (const field of METAMASK_DEP_FIELDS) {
    for (const dep of deps) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (MetaMask SDK)`);
      }
    }
  }
}

function readPackage(pkg, context) {
  stripWalletConnectDependencies(pkg, context);

  stripTrezorDependencies(pkg, context);

  stripMetaMaskDependencies(pkg, context);

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
