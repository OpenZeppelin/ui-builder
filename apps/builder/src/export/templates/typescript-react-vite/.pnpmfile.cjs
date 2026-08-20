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

function readPackage(pkg, context) {
  stripTrezorDependencies(pkg, context);

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
