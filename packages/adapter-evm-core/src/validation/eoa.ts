import type { EoaExecutionConfig } from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import { isValidEvmAddress } from '../utils/validation';

const SYSTEM_LOG_TAG = 'EoaValidator';

/**
 * Wallet connection status for EOA validation
 */
export interface EvmWalletStatus {
  isConnected: boolean;
  address?: string;
}

/**
 * Validates an EOA execution configuration.
 *
 * @param config The EOA execution config to validate
 * @param walletStatus Optional wallet connection status for address validation
 * @returns true if valid, or an error message string if invalid
 */
export async function validateEoaConfig(
  config: EoaExecutionConfig,
  walletStatus?: EvmWalletStatus
): Promise<true | string> {
  if (!config.allowAny) {
    if (!config.specificAddress) {
      return "EOA execution selected, but no specific address was provided when 'allowAny' is false.";
    }
    if (!isValidEvmAddress(config.specificAddress)) {
      return `Invalid specific EOA address format: ${config.specificAddress}`;
    }
    if (walletStatus?.isConnected && walletStatus.address) {
      if (walletStatus.address.toLowerCase() !== config.specificAddress.toLowerCase()) {
        return `Connected wallet address (${walletStatus.address}) does not match the required specific EOA address (${config.specificAddress}). Please connect the correct wallet.`;
      }
    } else if (walletStatus?.isConnected && !walletStatus.address) {
      logger.warn(
        SYSTEM_LOG_TAG,
        'Wallet is connected but address is unavailable for EOA validation.'
      );
      return 'Connected wallet address is not available for validation against specific EOA.';
    }
  }
  return true;
}

/**
 * Simple validation of EOA config without wallet status check.
 * Useful for static validation before execution.
 */
export function validateEvmEoaConfig(config: EoaExecutionConfig): boolean {
  if (!config.allowAny) {
    if (!config.specificAddress) {
      return false;
    }
    if (!isValidEvmAddress(config.specificAddress)) {
      return false;
    }
  }
  return true;
}
