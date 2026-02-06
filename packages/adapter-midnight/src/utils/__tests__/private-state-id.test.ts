/**
 * Unit tests for Private State ID generation utility
 */
import { describe, expect, it } from 'vitest';

import { generatePrivateStateId } from '../private-state-id';

describe('generatePrivateStateId', () => {
  const contractAddress = '0200326c95873182775840764ae28e8750f73a68f236800171ebd92520e96a9fffb6';
  const walletAddress =
    'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';

  it('should generate a deterministic ID from contract and wallet addresses', () => {
    const id1 = generatePrivateStateId(contractAddress, walletAddress);
    const id2 = generatePrivateStateId(contractAddress, walletAddress);

    expect(id1).toBe(id2);
  });

  it('should generate ID with correct prefix', () => {
    const id = generatePrivateStateId(contractAddress, walletAddress);

    expect(id.startsWith('ps_')).toBe(true);
  });

  it('should generate different IDs for different contract addresses', () => {
    const id1 = generatePrivateStateId(contractAddress, walletAddress);
    const id2 = generatePrivateStateId(
      '0200aaaabbbbccccdddd0000111122223333444455556666777788889999aaaabbbbcc',
      walletAddress
    );

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different wallet addresses', () => {
    const id1 = generatePrivateStateId(contractAddress, walletAddress);
    const id2 = generatePrivateStateId(contractAddress, 'addr_test1different_wallet_address_here');

    expect(id1).not.toBe(id2);
  });

  it('should handle case-insensitive contract addresses', () => {
    const id1 = generatePrivateStateId(contractAddress.toLowerCase(), walletAddress);
    const id2 = generatePrivateStateId(contractAddress.toUpperCase(), walletAddress);

    expect(id1).toBe(id2);
  });

  it('should handle whitespace in addresses', () => {
    const id1 = generatePrivateStateId(contractAddress, walletAddress);
    const id2 = generatePrivateStateId(`  ${contractAddress}  `, `  ${walletAddress}  `);

    expect(id1).toBe(id2);
  });

  it('should generate non-empty ID', () => {
    const id = generatePrivateStateId(contractAddress, walletAddress);

    expect(id.length).toBeGreaterThan(3); // 'ps_' + at least 1 char
  });
});
