import type { EvmNetworkConfig } from '@openzeppelin/transaction-form-types';

// No longer need PUBLIC_RPC_FALLBACKS array or individual constants here

/**
 * Resolves the RPC URL to use based on environment variables and network config.
 *
 * Priority:
 * 1. VITE_RPC_URL_<NETWORK_ID> (e.g., VITE_RPC_URL_ETHEREUM_SEPOLIA)
 * 2. networkConfig.rpcUrl (which should be a public RPC for that specific network).
 *
 * @param networkConfig The network configuration object containing a default public rpcUrl.
 * @returns The resolved RPC URL string.
 * @throws If networkConfig.rpcUrl is missing and no override is found (should not happen with proper config).
 */
export function resolveRpcUrl(networkConfig: EvmNetworkConfig): string {
  const env = import.meta.env;
  const networkIdUpper = networkConfig.id.toUpperCase().replace(/-/g, '_');
  const envVarKey = `VITE_RPC_URL_${networkIdUpper}`;

  console.log(`[resolveRpcUrl] Received config for resolving RPC: ${networkConfig.id}`);
  console.log('[resolveRpcUrl] Env Var Checked:', {
    [envVarKey]: env[envVarKey],
  });

  // 1. Specific Network ID Env Var (e.g., VITE_RPC_URL_ETHEREUM_SEPOLIA)
  const specificNetworkEnvVar = env[envVarKey];
  if (specificNetworkEnvVar) {
    console.debug(`Using RPC URL from env var ${envVarKey}: ${specificNetworkEnvVar}`);
    return specificNetworkEnvVar;
  }

  // 2. Fallback to the rpcUrl defined in the networkConfig itself
  if (networkConfig.rpcUrl) {
    console.debug(
      `Using RPC URL from networkConfig for ${networkConfig.name}: ${networkConfig.rpcUrl}`
    );
    return networkConfig.rpcUrl;
  }

  // This should ideally not be reached if networkConfigs always have a valid public rpcUrl
  console.error(
    `RPC URL is missing in networkConfig and no override env var (${envVarKey}) is set for ${networkConfig.name}`
  );
  throw new Error(
    `Could not resolve RPC URL for network: ${networkConfig.name}. Please ensure networkConfig.rpcUrl is set or provide the ${envVarKey} environment variable.`
  );
}
