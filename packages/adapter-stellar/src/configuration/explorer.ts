/*
 * Stellar Explorer Configuration
 *
 * DESIGN NOTE: This module provides minimal explorer functionality compared to EVM adapters.
 * Stellar explorers are used only for generating display URLs, unlike EVM where explorers
 * are critical infrastructure for ABI fetching. See comments below for detailed explanation.
 */

import { NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';
import type { UserExplorerConfig } from '@openzeppelin/contracts-ui-builder-types';

import { isValidContractAddress } from '../validation';

/**
 * Gets a blockchain explorer URL for an address on Stellar.
 * Uses the explorerUrl from the network configuration.
 *
 * @param address The address to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the address on the configured Stellar explorer, or null.
 */
export function getStellarExplorerAddressUrl(
  address: string,
  networkConfig: NetworkConfig
): string | null {
  if (!address || !networkConfig.explorerUrl) {
    return null;
  }
  // Use /contract for Soroban contract IDs, otherwise /account
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  const path = isValidContractAddress(address) ? 'contract' : 'account';
  return `${baseUrl}/${path}/${encodeURIComponent(address)}`;
}

/**
 * Gets a blockchain explorer URL for a transaction on Stellar.
 * Uses the explorerUrl from the network configuration.
 *
 * @param txHash - The hash of the transaction to get the explorer URL for
 * @param networkConfig The network configuration object.
 * @returns A URL to view the transaction on the configured Stellar explorer, or null.
 */
export function getStellarExplorerTxUrl(
  txHash: string,
  networkConfig: NetworkConfig
): string | null {
  if (!txHash || !networkConfig.explorerUrl) {
    return null;
  }
  // Construct the URL, assuming a standard /tx/ path for Stellar explorers
  const baseUrl = networkConfig.explorerUrl.replace(/\/+$/, '');
  return `${baseUrl}/tx/${encodeURIComponent(txHash)}`;
}

/**
 * Validates a Stellar explorer configuration.
 *
 * NOTE: This validation is minimal compared to EVM - only checks URL formats.
 * No API key validation or connection testing since Stellar explorers are
 * display-only (not used for contract ABI fetching like in EVM).
 */
export function validateStellarExplorerConfig(explorerConfig: UserExplorerConfig): boolean {
  // Validate URLs if provided
  if (explorerConfig.explorerUrl) {
    try {
      new URL(explorerConfig.explorerUrl);
    } catch {
      return false;
    }
  } else {
    // explorerUrl is required
    return false;
  }

  if (explorerConfig.apiUrl) {
    try {
      new URL(explorerConfig.apiUrl);
    } catch {
      return false;
    }
  }

  // Basic API key validation (not empty)
  if (explorerConfig.apiKey !== undefined && explorerConfig.apiKey.trim().length === 0) {
    return false;
  }

  return true;
}

/*
 * NOTE: Unlike EVM adapters, Stellar does not implement explorer connection testing.
 *
 * DESIGN DECISION: Stellar explorers are used only for generating display URLs,
 * not for critical functionality like ABI fetching (which EVM requires).
 *
 * Key differences from EVM:
 * - EVM: Explorers provide essential APIs for contract ABI fetching
 * - Stellar: Explorers are display-only; contract loading uses Soroban RPC directly
 * - EVM: Multiple explorer providers with varying API formats requiring validation
 * - Stellar: Standardized ecosystem using Horizon API underneath
 *
 * Therefore, testing explorer "connectivity" would only verify website availability,
 * which provides no functional value and adds unnecessary complexity.
 */
