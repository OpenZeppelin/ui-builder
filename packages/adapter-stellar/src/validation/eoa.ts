import { EoaExecutionConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { StellarWalletConnectionStatus } from '../wallet/types';
import { isValidAddress } from './address';

const SYSTEM_LOG_TAG = 'StellarEoaValidator';

export async function validateEoaConfig(
  config: EoaExecutionConfig,
  walletStatus: StellarWalletConnectionStatus
): Promise<true | string> {
  if (!config.allowAny) {
    if (!config.specificAddress) {
      return "EOA execution selected, but no specific address was provided when 'allowAny' is false.";
    }
    if (!isValidAddress(config.specificAddress)) {
      return `Invalid specific Stellar address format: ${config.specificAddress}`;
    }
    if (walletStatus.isConnected && walletStatus.address) {
      if (walletStatus.address !== config.specificAddress) {
        return `Connected wallet address (${walletStatus.address}) does not match the required specific Stellar address (${config.specificAddress}). Please connect the correct wallet.`;
      }
    } else if (walletStatus.isConnected && !walletStatus.address) {
      logger.warn(
        SYSTEM_LOG_TAG,
        'Wallet is connected but address is unavailable for Stellar EOA validation.'
      );
      return 'Connected wallet address is not available for validation against specific Stellar address.';
    }
  }
  return true;
}
