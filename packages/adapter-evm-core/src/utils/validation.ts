import { isAddress } from 'viem';

/**
 * Validates if a string is a valid EVM address.
 * @param address The address string to validate.
 * @returns True if the address is valid, false otherwise.
 */
export function isValidEvmAddress(address: string): boolean {
  return isAddress(address);
}
