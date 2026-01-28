/**
 * Utility for generating deterministic Private State IDs
 *
 * Private State ID is an implementation detail used by the Midnight SDK to manage
 * user's encrypted state data in browser storage. Instead of requiring manual input
 * from users, we generate it deterministically based on contract address and wallet
 * address, ensuring:
 *
 * 1. Same user + same contract = same private state (automatic state restoration)
 * 2. Different users get isolated private state (user privacy)
 * 3. No manual input needed (reduced friction and errors)
 */

import { simpleHash } from '@openzeppelin/ui-builder-utils';

/**
 * Generates a deterministic Private State ID from contract address and wallet address.
 *
 * The generated ID is:
 * - Deterministic: Same inputs always produce the same output
 * - Unique: Different contract/wallet combinations produce different IDs
 * - Human-readable prefix: Helps with debugging and transparency
 *
 * @param contractAddress - The deployed Midnight contract address
 * @param walletAddress - The connected wallet's address
 * @returns A deterministic private state ID string
 *
 * @example
 * ```typescript
 * const privateStateId = generatePrivateStateId(
 *   '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6',
 *   'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp'
 * );
 * // Result: 'ps_a1b2c3d4' (deterministic hash-based ID)
 * ```
 */
export function generatePrivateStateId(contractAddress: string, walletAddress: string): string {
  // Normalize inputs to ensure consistency
  const normalizedContract = contractAddress.toLowerCase().trim();
  const normalizedWallet = walletAddress.toLowerCase().trim();

  // Create a combined string for hashing
  const combined = `${normalizedContract}:${normalizedWallet}`;

  // Generate hash and prefix with 'ps_' for clarity
  const hash = simpleHash(combined);

  return `ps_${hash}`;
}
