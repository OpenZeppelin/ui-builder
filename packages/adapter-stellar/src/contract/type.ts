import { Contract, rpc as StellarRpc, xdr } from '@stellar/stellar-sdk';

import type { StellarNetworkConfig } from '@openzeppelin/ui-builder-types';
import { logger, userRpcConfigService } from '@openzeppelin/ui-builder-utils';

/**
 * Returns a Soroban RPC server instance honoring user overrides.
 */
function getSorobanRpcServer(networkConfig: StellarNetworkConfig): StellarRpc.Server {
  const customRpcConfig = userRpcConfigService.getUserRpcConfig(networkConfig.id);
  const rpcUrl = customRpcConfig?.url || networkConfig.sorobanRpcUrl;
  if (!rpcUrl) {
    throw new Error(`No Soroban RPC URL available for network ${networkConfig.name}`);
  }
  const allowHttp = new URL(rpcUrl).hostname === 'localhost';
  return new StellarRpc.Server(rpcUrl, { allowHttp });
}

export type StellarContractExecutableType =
  | 'contractExecutableWasm'
  | 'contractExecutableStellarAsset'
  | null;

/**
 * Detects executable type for a given Stellar contract ID via RPC ledger entries.
 */
export async function getStellarContractType(
  contractId: string,
  networkConfig: StellarNetworkConfig
): Promise<StellarContractExecutableType> {
  try {
    if (!contractId) {
      return null;
    }

    const rpcServer = getSorobanRpcServer(networkConfig);

    // Build ledger key footprint for the contract
    const ledgerKey = new Contract(contractId).getFootprint();
    const ledgerEntries = await rpcServer.getLedgerEntries(ledgerKey);

    const first = ledgerEntries?.entries?.[0]?.val;
    if (!first) {
      throw new Error('Could not obtain contract data from server.');
    }

    const executable = first.contractData()?.val()?.instance()?.executable();
    if (!executable) {
      throw new Error('Could not get executable from contract data.');
    }

    const execWasmType = xdr.ContractExecutableType.contractExecutableWasm().name;
    const execStellarAssetType = xdr.ContractExecutableType.contractExecutableStellarAsset().name;
    const detected = executable.switch()?.name as string | undefined;

    if (detected === execWasmType) return 'contractExecutableWasm';
    if (detected === execStellarAssetType) return 'contractExecutableStellarAsset';
    return null;
  } catch (error) {
    logger.error('stellar:contract-type', 'Failed to detect contract type:', error);
    throw new Error(
      `Something went wrong getting contract type by contract ID. ${(error as Error).message}`
    );
  }
}
