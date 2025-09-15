import { StrKey } from '@stellar/stellar-sdk';

/**
 * Stellar address types supported by the validation functions
 */
export type StellarAddressType =
  | 'account' // G... - Ed25519 public keys (standard account addresses)
  | 'contract' // C... - Contract addresses
  | 'muxed' // M... - Muxed account addresses (for exchanges/sub-accounts)
  | 'secret' // S... - Secret seeds (private keys)
  | 'signed-payload' // P... - Signed payload addresses
  | 'pre-auth-tx' // T... - Pre-authorized transaction hashes
  | 'hash-x'; // X... - Hash-x condition addresses

/**
 * Validate a standard Stellar account address (Ed25519 public key starting with 'G')
 * @param address The address to validate
 * @returns Whether the address is a valid account address
 */
export function isValidAccountAddress(address: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Validate a Stellar contract address (starting with 'C')
 * @param address The address to validate
 * @returns Whether the address is a valid contract address
 */
export function isValidContractAddress(address: string): boolean {
  try {
    return StrKey.isValidContract(address);
  } catch {
    return false;
  }
}

/**
 * Validate a Stellar muxed account address (starting with 'M')
 * @param address The address to validate
 * @returns Whether the address is a valid muxed account address
 */
export function isValidMuxedAddress(address: string): boolean {
  try {
    return StrKey.isValidMed25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Validate a Stellar secret seed (private key starting with 'S')
 * @param seed The secret seed to validate
 * @returns Whether the seed is a valid secret seed
 */
export function isValidSecretSeed(seed: string): boolean {
  try {
    return StrKey.isValidEd25519SecretSeed(seed);
  } catch {
    return false;
  }
}

/**
 * Validate a signed payload address (starting with 'P')
 * @param address The address to validate
 * @returns Whether the address is a valid signed payload address
 */
export function isValidSignedPayloadAddress(address: string): boolean {
  try {
    return StrKey.isValidSignedPayload(address);
  } catch {
    return false;
  }
}

/**
 * Main validation function that supports all Stellar address types
 * @param address The address to validate
 * @param addressType Optional specific address type to validate
 * @returns Whether the address is valid for the specified or any supported type
 */
export function isValidAddress(address: string, addressType?: StellarAddressType): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // If specific type is requested, validate only that type
  if (addressType) {
    switch (addressType) {
      case 'account':
        return isValidAccountAddress(address);
      case 'contract':
        return isValidContractAddress(address);
      case 'muxed':
        return isValidMuxedAddress(address);
      case 'secret':
        return isValidSecretSeed(address);
      case 'signed-payload':
        return isValidSignedPayloadAddress(address);
      case 'pre-auth-tx':
        try {
          // Pre-auth transactions start with 'T' - validate by trying to decode
          StrKey.decodePreAuthTx(address);
          return true;
        } catch {
          return false;
        }
      case 'hash-x':
        try {
          // Hash-x conditions start with 'X' - validate by trying to decode
          StrKey.decodeSha256Hash(address);
          return true;
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  // If no specific type requested, validate against common address types
  // (excluding secrets and special-purpose addresses for security)
  try {
    return (
      StrKey.isValidEd25519PublicKey(address) || // G... - accounts (most common)
      StrKey.isValidContract(address) || // C... - contracts
      StrKey.isValidMed25519PublicKey(address) // M... - muxed accounts
    );
  } catch {
    return false;
  }
}
