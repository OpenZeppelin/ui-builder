import { EoaExecutionConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { isValidEvmAddress } from '../utils';
import { EvmWalletConnectionStatus } from '../wallet/types';

const SYSTEM_LOG_TAG = 'EoaValidator';

export async function validateEoaConfig(
  config: EoaExecutionConfig,
  walletStatus: EvmWalletConnectionStatus
): Promise<true | string> {
  if (!config.allowAny) {
    if (!config.specificAddress) {
      return "EOA execution selected, but no specific address was provided when 'allowAny' is false.";
    }
    if (!isValidEvmAddress(config.specificAddress)) {
      return `Invalid specific EOA address format: ${config.specificAddress}`;
    }
    if (walletStatus.isConnected && walletStatus.address) {
      if (walletStatus.address.toLowerCase() !== config.specificAddress.toLowerCase()) {
        return `Connected wallet address (${walletStatus.address}) does not match the required specific EOA address (${config.specificAddress}). Please connect the correct wallet.`;
      }
    } else if (walletStatus.isConnected && !walletStatus.address) {
      logger.warn(
        SYSTEM_LOG_TAG,
        'Wallet is connected but address is unavailable for EOA validation.'
      );
      return 'Connected wallet address is not available for validation against specific EOA.';
    }
  }
  return true;
}
