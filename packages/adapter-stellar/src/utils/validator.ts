/**
 * Validate a Stellar blockchain address
 * @param address The address to validate
 * @returns Whether the address is a valid Stellar address
 */
export function isValidAddress(address: string): boolean {
  // Basic check for Stellar addresses (starts with G and is 56 chars long)
  // TODO: Use a proper Stellar SDK for validation when focusing on that chain
  return /^G[A-Z0-9]{55}$/.test(address);
}
